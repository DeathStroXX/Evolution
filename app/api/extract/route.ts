import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b:free"; // free model, swap if needed

const SYSTEM_PROMPT =
  "You extract event information from text. Return ONLY valid JSON with no code fences. Fields: title (string), description (string), startsAt (ISO 8601 string or null), location (string or null), tags (array of strings from: AI, IT, Startup, Design, Community, Workshop, Hackathon, Networking).";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * POST /api/extract
 * Receives { url?, text? } and uses AI to extract structured event data.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const url = typeof body.url === "string" ? body.url.trim() : "";
    const rawText = typeof body.text === "string" ? body.text.trim() : "";

    if (!url && !rawText) {
      return NextResponse.json(
        { error: "Provide either a URL or text to extract from." },
        { status: 400 }
      );
    }

    let sourceText = rawText;

    // If a URL was provided, fetch its text content server-side
    if (url) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "CommunityConnect/1.0" },
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
          { error: "Could not fetch the URL. Please paste the event text instead." },
          { status: 422 }
        );
      }
    }

    if (!sourceText) {
      return NextResponse.json(
        { error: "No text content found to extract from." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI API key not configured." },
        { status: 500 }
      );
    }

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
          { role: "user", content: sourceText },
        ],
        temperature: 0.1,
        max_tokens: 1000,
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
    const rawResponse = aiData.choices?.[0]?.message?.content || "";
    const cleaned = stripCodeFences(rawResponse);

    let event: unknown;
    try {
      event = JSON.parse(cleaned);
      return NextResponse.json(event);
    } catch {
      console.error("Failed to parse AI response:", cleaned);
      return NextResponse.json(
        { error: "AI returned invalid data. Please fill the form manually.", raw: cleaned },
        { status: 422 }
      );
    }
  } catch (err: any) {
    console.error("Extract route error:", err);
    return NextResponse.json({ error: "Server error during extraction." }, { status: 500 });
  }
}
