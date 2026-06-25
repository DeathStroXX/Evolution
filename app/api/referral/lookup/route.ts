import { NextResponse } from "next/server";
import { referrals, profiles } from "@/lib/collections";

export const dynamic = "force-dynamic";

/**
 * GET /api/referral/lookup?code=XXXX
 * Resolves a referral code to the referrer's display name so the event page can
 * greet invitees with "[Name] invited you". Public — no auth required.
 * Returns 404 when the code is unknown or the referrer has no name set.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const referralsCol = await referrals();
  const referral = await referralsCol.findOne({ code });
  if (!referral) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profilesCol = await profiles();
  const profile = await profilesCol.findOne(
    { _id: referral.referrerId },
    { projection: { name: 1 } }
  );
  const name = profile?.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ name, eventId: referral.eventId });
}
