import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { events } from "@/lib/collections";
import type { Event } from "@/lib/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:free";

const SYSTEM_PROMPT =
  "You extract multiple upcoming events from text (e.g. an index page). Return ONLY a JSON array of event objects. Do NOT wrap in markdown fences. If no events are found, return []. " +
  "For each event, use these fields: title (string), description (string), startsAt (ISO 8601 string or null), location (string or null), sourceUrl (string or null), imageUrl (string or null), tags (array of strings from: AI, IT, Startup, Design, Community, Workshop, Hackathon, Networking).";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000); // Allow more text for index pages, but cap at ~15k chars to avoid token limits on free models
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const userId = cookies().get("session")?.value;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json({ error: "Provide a url to extract from." }, { status: 400 });
    }

    // Fetch the URL
    let sourceText = "";
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CommunityConnect-Ingest/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch url (status ${res.status}).` },
          { status: 400 }
        );
      }
      const html = await res.text();
      sourceText = stripHtml(html);
    } catch {
      return NextResponse.json(
        { error: "Could not fetch the URL." },
        { status: 422 }
      );
    }

    if (!sourceText) {
      return NextResponse.json({ error: "No text content found." }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured." }, { status: 500 });
    }

    // Call OpenRouter
    const aiRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mainfranken-community.vercel.app",
        "X-Title": "Mainfranken Community Connect",
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
      const errBody = await aiRes.text();
      console.error("OpenRouter error:", aiRes.status, errBody);
      return NextResponse.json(
        { error: "AI extraction failed due to upstream limit. Try again." },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const rawResponse = aiData.choices?.[0]?.message?.content || "[]";
    const cleaned = stripCodeFences(rawResponse);

    let parsedEvents: any[];
    try {
      parsedEvents = JSON.parse(cleaned);
      if (!Array.isArray(parsedEvents)) {
        throw new Error("Result is not an array");
      }
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid data format.", raw: cleaned },
        { status: 422 }
      );
    }

    if (parsedEvents.length === 0) {
      return NextResponse.json({ message: "No events found.", count: 0 });
    }

    // Map and insert into DB
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const dbEvents: Event[] = parsedEvents.map((e) => {
      let startsAt: Date | undefined;
      if (typeof e.startsAt === "string" && e.startsAt) {
        const parsed = new Date(e.startsAt);
        if (!Number.isNaN(parsed.getTime())) startsAt = parsed;
      }

      const tags = Array.isArray(e.tags) ? e.tags.filter((t: any) => typeof t === "string") : [];

      return {
        _id: randomUUID(),
        title: str(e.title) || "Untitled Event",
        description: str(e.description),
        startsAt,
        location: str(e.location),
        sourceUrl: str(e.sourceUrl) || url,
        imageUrl: str(e.imageUrl),
        tags,
        organizerId: userId,
        createdAt: new Date(),
      };
    });

    const eventsCol = await events();
    await eventsCol.insertMany(dbEvents);

    return NextResponse.json({
      message: `Successfully ingested ${dbEvents.length} events.`,
      count: dbEvents.length,
      events: dbEvents,
    });
  } catch (err: any) {
    console.error("Ingest route error:", err);
    return NextResponse.json({ error: "Server error during ingestion." }, { status: 500 });
  }
}
