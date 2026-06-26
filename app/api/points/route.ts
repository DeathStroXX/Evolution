import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pointsLedger } from "@/lib/collections";
import { getPointsSummary, computeTier, computeBadges } from "@/lib/points";

export const dynamic = "force-dynamic";

interface EventPointsSummary {
  points: number;
  signupCount: number;
  checkinCount: number;
}

/**
 * GET /api/points
 *
 * Two modes:
 *  - With ?eventId=X&userId=Y — aggregates one user's ledger for a single event
 *    ({ points, signupCount, checkinCount }). Used by SharePanel to render
 *    referral-reward progress (e.g. "2/5 referrals").
 *  - With no query params — returns the logged-in user's full gamified summary
 *    (totals by reason, tier progress, achievement badges) for the /me page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  // ---- Per-event mode (back-compat with SharePanel) -------------------------
  if (eventId || userId) {
    if (!eventId || !userId) {
      return NextResponse.json(
        { error: "eventId and userId are required" },
        { status: 400 }
      );
    }

    const col = await pointsLedger();
    const [row] = await col
      .aggregate<EventPointsSummary>([
        { $match: { eventId, userId } },
        {
          $group: {
            _id: "$userId",
            points: { $sum: "$points" },
            signupCount: {
              $sum: { $cond: [{ $eq: ["$reason", "signup"] }, 1, 0] },
            },
            checkinCount: {
              $sum: { $cond: [{ $eq: ["$reason", "checkin"] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      eventId,
      userId,
      points: row?.points ?? 0,
      signupCount: row?.signupCount ?? 0,
      checkinCount: row?.checkinCount ?? 0,
    });
  }

  // ---- Summary mode (gamified /me dashboard) --------------------------------
  const sessionId = cookies().get("session")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const summary = await getPointsSummary(sessionId);

  return NextResponse.json({
    ...summary,
    tier: computeTier(summary.totalPoints),
    badges: computeBadges(summary),
  });
}
