import { NextResponse } from "next/server";
import { pointsLedger, profiles } from "@/lib/collections";

export const dynamic = "force-dynamic";

interface LeaderRow {
  userId: string;
  signupCount: number;
  points: number;
}

/**
 * GET /api/leaderboard?eventId=X&limit=3
 * Public top-referrers for an event: the members who brought the most people
 * (referred sign-ups), aggregated from the points ledger — same source as the
 * full leaderboard page. Returns { rows: [{ userId, name, count }] }.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), 50)
      : 3;

  const ledgerCol = await pointsLedger();
  const rows = await ledgerCol
    .aggregate<LeaderRow>([
      { $match: { eventId } },
      {
        $group: {
          _id: "$userId",
          points: { $sum: "$points" },
          signupCount: {
            $sum: { $cond: [{ $eq: ["$reason", "signup"] }, 1, 0] },
          },
        },
      },
      // Only members who have actually brought someone in.
      { $match: { signupCount: { $gt: 0 } } },
      { $sort: { signupCount: -1, points: -1 } },
      { $limit: limit },
      { $project: { _id: 0, userId: "$_id", signupCount: 1, points: 1 } },
    ])
    .toArray();

  if (rows.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  // Resolve display names.
  const profilesCol = await profiles();
  const userIds = rows.map((r) => r.userId);
  const profileDocs = await profilesCol
    .find({ _id: { $in: userIds } }, { projection: { name: 1 } })
    .toArray();
  const nameById = new Map(
    profileDocs.map((p) => [p._id, p.name?.trim() || ""])
  );

  const result = rows.map((r) => ({
    userId: r.userId,
    name: nameById.get(r.userId) || "Anonymous",
    count: r.signupCount,
  }));

  return NextResponse.json({ rows: result });
}
