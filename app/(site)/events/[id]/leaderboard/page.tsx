import Link from "next/link";
import { notFound } from "next/navigation";
import { events, pointsLedger, profiles } from "@/lib/collections";
import type { Profile } from "@/lib/types";

// Leaderboard is aggregated from the points ledger at request time.
export const dynamic = "force-dynamic";

interface LeaderboardRow {
  userId: string;
  points: number;
  checkinCount: number;
  signupCount: number;
}

const rankAccents = [
  {
    // Gold
    container: "border-amber-300 bg-amber-50",
    badge: "bg-amber-400 text-amber-950",
    medal: "🥇",
  },
  {
    // Silver
    container: "border-slate-300 bg-slate-50",
    badge: "bg-slate-300 text-slate-900",
    medal: "🥈",
  },
  {
    // Bronze
    container: "border-orange-300 bg-orange-50",
    badge: "bg-orange-400 text-orange-950",
    medal: "🥉",
  },
];

export default async function EventLeaderboardPage({
  params,
}: {
  params: { id: string };
}) {
  const eventsCol = await events();
  const event = await eventsCol.findOne({ _id: params.id });

  if (!event) {
    notFound();
  }

  const ledgerCol = await pointsLedger();
  const rows = await ledgerCol
    .aggregate<LeaderboardRow>([
      { $match: { eventId: params.id } },
      {
        $group: {
          _id: "$userId",
          points: { $sum: "$points" },
          checkinCount: {
            $sum: { $cond: [{ $eq: ["$reason", "checkin"] }, 1, 0] },
          },
          signupCount: {
            $sum: { $cond: [{ $eq: ["$reason", "signup"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          points: 1,
          checkinCount: 1,
          signupCount: 1,
        },
      },
      { $sort: { checkinCount: -1, points: -1 } },
    ])
    .toArray();

  // Resolve display names for the users on the board.
  const profilesCol = await profiles();
  const userIds = rows.map((row) => row.userId);
  const profileDocs =
    userIds.length > 0
      ? await profilesCol.find({ _id: { $in: userIds } }).toArray()
      : [];
  const nameById = new Map<string, string>(
    profileDocs.map((p: Profile) => [p._id, p.name ?? p.email ?? "Anonymous"]),
  );

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <Link
          href={`/events/${event._id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to {event.title}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Referral leaderboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Top members bringing people to {event.title}.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
          <p className="text-base font-medium">No referral activity yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Be the first to share!
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => {
            const rank = index + 1;
            const accent = rankAccents[index];
            const name = nameById.get(row.userId) ?? "Anonymous";

            return (
              <li
                key={row.userId}
                className={`flex items-center gap-4 rounded-2xl border p-4 sm:p-5 ${
                  accent ? accent.container : "border-border bg-card"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    accent ? accent.badge : "bg-secondary text-foreground"
                  }`}
                >
                  {accent ? accent.medal : rank}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground sm:hidden">
                    {row.checkinCount} check-ins · {row.signupCount} sign-ups
                  </p>
                </div>

                <dl className="hidden gap-8 text-center sm:flex">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Check-ins
                    </dt>
                    <dd className="text-lg font-semibold">{row.checkinCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Sign-ups
                    </dt>
                    <dd className="text-lg font-semibold">{row.signupCount}</dd>
                  </div>
                </dl>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-primary">{row.points}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    points
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
