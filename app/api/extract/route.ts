import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(req: Request) {
  let body: { url?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  const rawText = typeof body.text === "string" ? body.text.trim() : "";

  if (!url && !rawText) {
    return NextResponse.json(
      { error: "Provide either a url or text to extract from." },
      { status: 400 }
    );
  }

  // Resolve the source text: either fetched from the URL or supplied directly.
  let sourceText = rawText;
  if (url) {
    try {
      const res = await fetch(url);
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
        { error: "Could not fetch the provided url." },
        { status: 400 }
      );
    }
  }

  if (!sourceText) {
    return NextResponse.json(
      { error: "No text content found to extract from." },
      { status: 400 }
    );
  }

  let responseText: string;
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: sourceText }],
    });

    responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
  } catch {
    return NextResponse.json(
      { error: "The extraction service is unavailable. Please try again." },
      { status: 500 }
    );
  }

  let event: unknown;
  try {
    event = JSON.parse(stripCodeFences(responseText));
  } catch {
    return NextResponse.json(
      { error: "Could not parse the extracted event data." },
      { status: 500 }
    );
  }

  return NextResponse.json(event);
}
