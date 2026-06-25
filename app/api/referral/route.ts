import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { referrals } from "@/lib/collections";
import type { Referral } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/referral?eventId=X&userId=Y
 * Returns the user's referral for the event, creating one (with a fresh short
 * code) the first time it is requested.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  if (!eventId || !userId) {
    return NextResponse.json(
      { error: "eventId and userId are required" },
      { status: 400 }
    );
  }

  const col = await referrals();

  const existing = await col.findOne({ eventId, referrerId: userId });
  if (existing) {
    return NextResponse.json(existing);
  }

  const referral: Referral = {
    _id: randomUUID(),
    eventId,
    referrerId: userId,
    code: randomUUID().slice(0, 8),
    clicks: 0,
    createdAt: new Date(),
  };

  try {
    await col.insertOne(referral);
  } catch (err) {
    // Unique index on { eventId, referrerId } — another request created it
    // first. Fall back to the now-existing doc.
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      const created = await col.findOne({ eventId, referrerId: userId });
      if (created) return NextResponse.json(created);
    }
    throw err;
  }

  return NextResponse.json(referral, { status: 201 });
}

/**
 * PUT /api/referral
 * Body: { code }. Increments the click counter for the matching referral.
 */
export async function PUT(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const code = body.code;
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const col = await referrals();
  await col.updateOne({ code }, { $inc: { clicks: 1 } });

  return NextResponse.json({ ok: true });
}
