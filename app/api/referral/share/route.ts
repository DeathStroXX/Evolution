import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { pointsLedger } from "@/lib/collections";
import type { PointsEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const SHARE_POINTS = 5;

/**
 * POST /api/referral/share
 * Body: { eventId, platform }. Awards share points to the logged-in user,
 * once per (user, event, platform) thanks to the unique dedupeKey.
 */
export async function POST(request: Request) {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { eventId?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const eventId = body.eventId;
  const platform = body.platform;
  if (!eventId || !platform) {
    return NextResponse.json(
      { error: "eventId and platform are required" },
      { status: 400 }
    );
  }

  const entry: PointsEntry = {
    _id: randomUUID(),
    userId,
    eventId,
    reason: "share",
    points: SHARE_POINTS,
    dedupeKey: `share:${userId}:${eventId}:${platform}`,
    createdAt: new Date(),
  };

  try {
    const col = await pointsLedger();
    await col.insertOne(entry);
  } catch (err) {
    // Duplicate dedupeKey — already awarded for this platform.
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ ok: true, alreadyAwarded: true });
    }
    throw err;
  }

  return NextResponse.json({ ok: true, points: SHARE_POINTS });
}
