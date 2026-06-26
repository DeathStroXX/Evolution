import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

// The known community sources we want to automatically scrape.
const TARGET_URLS = [
  "https://www.zdi-mainfranken.de/events/",
  "https://www.uni-wuerzburg.de/aktuelles/veranstaltungen/",
  "https://www.thws.de/veranstaltungen/"
];

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:free";
const SYSTEM_PROMPT =
  "You extract multiple upcoming events from an index page or event listing. Return ONLY a JSON array of event objects. Do NOT wrap in markdown fences. If no events are found, return []. " +
  "Fields: title (string), description (string), startsAt (ISO 8601 string or null), location (string or null), sourceUrl (string or null), imageUrl (string or null), tags (array of strings from: AI, IT, Startup, Design, Community, Workshop, Hackathon, Networking).";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40000);
}

function stripCodeFences(text: string): string {
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

async function main() {
  console.log("Starting background event ingestion...");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing in .env");
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY missing in .env");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const eventsCol = db.collection("events");

  let totalIngested = 0;

  for (const url of TARGET_URLS) {
    console.log(`\nFetching ${url}...`);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "CommunityConnect-AutoIngest/1.0" } });
      if (!res.ok) {
        console.error(`Failed to fetch ${url} - Status ${res.status}`);
        continue;
      }
      const html = await res.text();
      const sourceText = stripHtml(html);

      console.log(`Extracting events via AI (${sourceText.length} chars of text)...`);
      const aiRes = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://mainfranken-community.vercel.app",
          "X-Title": "Mainfranken Auto Ingest",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `URL: ${url}\n\nCONTENT:\n${sourceText}` },
          ],
          temperature: 0.1,
          max_tokens: 3000,
        }),
      });

      if (!aiRes.ok) {
        console.error(`OpenRouter error: ${aiRes.status}`);
        continue;
      }

      const aiData = await aiRes.json();
      const rawResponse = aiData.choices?.[0]?.message?.content || "[]";
      const cleaned = stripCodeFences(rawResponse);

      const parsedEvents = JSON.parse(cleaned);
      if (!Array.isArray(parsedEvents) || parsedEvents.length === 0) {
        console.log("No events found or invalid format.");
        continue;
      }

      const dbEvents = parsedEvents.map((e) => {
        let startsAt: Date | undefined;
        if (typeof e.startsAt === "string" && e.startsAt) {
          const parsed = new Date(e.startsAt);
          if (!Number.isNaN(parsed.getTime())) startsAt = parsed;
        }
        const tags = Array.isArray(e.tags) ? e.tags.filter((t: any) => typeof t === "string") : [];
        return {
          _id: crypto.randomUUID(),
          title: (typeof e.title === "string" ? e.title.trim() : "") || "Untitled Event",
          description: typeof e.description === "string" ? e.description.trim() : undefined,
          startsAt,
          location: typeof e.location === "string" ? e.location.trim() : undefined,
          sourceUrl: (typeof e.sourceUrl === "string" ? e.sourceUrl.trim() : undefined) || url,
          imageUrl: typeof e.imageUrl === "string" ? e.imageUrl.trim() : undefined,
          tags,
          createdAt: new Date(),
          isAutoIngested: true,
        };
      });

      await eventsCol.insertMany(dbEvents);
      console.log(`Successfully ingested ${dbEvents.length} events from ${url}!`);
      totalIngested += dbEvents.length;

    } catch (err) {
      console.error(`Error processing ${url}:`, err);
    }
    
    // Sleep for 5 seconds to avoid free-tier rate limits
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`\nBackground ingestion complete. Total events added: ${totalIngested}`);
  await client.close();
}

main().catch(console.error);
