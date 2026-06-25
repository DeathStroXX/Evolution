import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  registrations,
  referrals,
  pointsLedger,
  rewardRules,
  profiles,
} from "@/lib/collections";
import type { PointsEntry } from "@/lib/types";

const CHECKIN_POINTS = 50;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const registrationId =
    typeof body.registrationId === "string" ? body.registrationId.trim() : "";
  if (!registrationId) {
    return NextResponse.json(
      { error: "registrationId is required." },
      { status: 400 }
    );
  }

  const registrationsCol = await registrations();
  const registration = await registrationsCol.findOne({ _id: registrationId });
  if (!registration) {
    return NextResponse.json(
      { error: "Registration not found." },
      { status: 404 }
    );
  }
  if (registration.checkedIn) {
    return NextResponse.json(
      { error: "Already checked in." },
      { status: 409 }
    );
  }

  await registrationsCol.updateOne(
    { _id: registrationId },
    { $set: { checkedIn: true, checkedInAt: new Date() } }
  );

  let rewardUnlocked = false;

  if (registration.referralCode) {
    const referralsCol = await referrals();
    const referral = await referralsCol.findOne({
      code: registration.referralCode,
    });

    if (referral) {
      const referrerId = referral.referrerId;
      const pointsCol = await pointsLedger();

      const entry: PointsEntry = {
        _id: randomUUID(),
        userId: referrerId,
        eventId: registration.eventId,
        reason: "checkin",
        points: CHECKIN_POINTS,
        dedupeKey: `checkin:${referrerId}:${registration.eventId}:${registration.userId}`,
        createdAt: new Date(),
      };

      try {
        await pointsCol.insertOne(entry);
      } catch (err) {
        // Duplicate dedupeKey — points already awarded for this check-in.
        if ((err as { code?: number }).code !== 11000) throw err;
      }

      const rewardRulesCol = await rewardRules();
      const rule = await rewardRulesCol.findOne({ _id: registration.eventId });
      if (rule) {
        const checkinPoints = await pointsCol.countDocuments({
          userId: referrerId,
          eventId: registration.eventId,
          reason: "checkin",
        });
        if (checkinPoints >= rule.threshold) rewardUnlocked = true;
      }
    }
  }

  const profilesCol = await profiles();
  const profile = await profilesCol.findOne({ _id: registration.userId });
  const attendeeName = profile?.name ?? "Attendee";

  return NextResponse.json({ success: true, rewardUnlocked, attendeeName });
}
