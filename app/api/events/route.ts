import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { events } from "@/lib/collections";
import type { Event } from "@/lib/types";

export async function POST(req: Request) {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const startsAtRaw = body.startsAt;
  let startsAt: Date | undefined;
  if (typeof startsAtRaw === "string" && startsAtRaw) {
    const parsed = new Date(startsAtRaw);
    if (!Number.isNaN(parsed.getTime())) startsAt = parsed;
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];

  const seatLimit =
    body.seatLimit != null && body.seatLimit !== "" && !Number.isNaN(Number(body.seatLimit))
      ? Number(body.seatLimit)
      : undefined;

  const str = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;

  const event: Event = {
    _id: randomUUID(),
    title,
    description: str(body.description),
    startsAt,
    location: str(body.location),
    sourceUrl: str(body.sourceUrl),
    imageUrl: str(body.imageUrl),
    tags,
    organizerId: userId,
    seatLimit,
    createdAt: new Date(),
  };

  const eventsCol = await events();
  await eventsCol.insertOne(event);

  return NextResponse.json(event, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get("organizerId") ?? undefined;

  const eventsCol = await events();
  const list = await eventsCol
    .find(organizerId ? { organizerId } : {})
    .sort({ startsAt: -1, createdAt: -1 })
    .toArray();

  return NextResponse.json(list);
}
