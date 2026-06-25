import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { registrations, referrals, pointsLedger } from "@/lib/collections";
import type { Registration, PointsEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { eventId?: string; referralCode?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const eventId = body.eventId;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const registration: Registration = {
    _id: randomUUID(),
    eventId,
    userId,
    referralCode: body.referralCode,
    checkedIn: false,
    createdAt: new Date(),
  };

  try {
    const col = await registrations();
    await col.insertOne(registration);
  } catch (err) {
    // Unique index on { eventId, userId } -> duplicate registration.
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }
    throw err;
  }

  // Award signup points to the referrer, if this registration came via a referral.
  if (body.referralCode) {
    try {
      const referral = await (await referrals()).findOne({
        code: body.referralCode,
      });
      if (referral) {
        const entry: PointsEntry = {
          _id: randomUUID(),
          userId: referral.referrerId,
          eventId: registration.eventId,
          reason: "signup",
          points: 20,
          dedupeKey: `signup:${referral.referrerId}:${registration.eventId}:${userId}`,
          createdAt: new Date(),
        };
        await (await pointsLedger()).insertOne(entry);
      }
    } catch (err) {
      // Unique index on { dedupeKey } -> points already awarded for this pair.
      if (!(err && typeof err === "object" && (err as { code?: number }).code === 11000)) {
        throw err;
      }
    }
  }

  return NextResponse.json(registration, { status: 201 });
}
