import { pointsLedger, profiles } from "@/lib/collections";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Deterministic palette so the same name keeps the same color across renders.
const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getLevel(count: number) {
  if (count >= 20) return 5;
  if (count >= 15) return 4;
  if (count >= 10) return 3;
  if (count >= 5) return 2;
  if (count >= 1) return 1;
  return 0;
}

export default async function GlobalLeaderboardPage() {
  const ledgerCol = await pointsLedger();
  const profileCol = await profiles();

  // Aggregate total referrals per user across all events
  const stats = await ledgerCol
    .aggregate<{ _id: string; totalReferrals: number }>([
      { $match: { reason: "signup" } },
      { $group: { _id: "$userId", totalReferrals: { $sum: 1 } } },
      { $sort: { totalReferrals: -1 } },
    ])
    .toArray();

  const userIds = stats.map((s) => s._id);
  const profileDocs = await profileCol
    .find({ _id: { $in: userIds } }, { projection: { name: 1 } })
    .toArray();

  const nameById = new Map(profileDocs.map((p) => [String(p._id), p.name?.trim() || "Anonymous"]));

  const leaderboard = stats.map((s, index) => {
    const count = s.totalReferrals;
    const name = nameById.get(s._id) || "Anonymous Member";
    return {
      userId: s._id,
      name,
      level: getLevel(count),
      rank: index + 1,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Community Leaderboard</h1>
        <p className="mt-3 text-muted-foreground">
          Top contributors bringing the Mainfranken tech community together.
        </p>
      </header>

      {leaderboard.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-semibold">No referrals yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Be the first to invite your friends to an upcoming event!
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/40">
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">Member</th>
                <th className="px-6 py-4 text-right font-semibold uppercase tracking-wider">Community Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaderboard.map((user) => (
                <tr key={user.userId} className="transition-colors hover:bg-secondary/20">
                  <td className="px-6 py-4 font-semibold text-muted-foreground">
                    #{user.rank}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/profile/${user.userId}`} className="group flex items-center gap-3 w-fit">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white transition-transform group-hover:scale-105",
                          colorFor(user.name)
                        )}
                        title={user.name}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground transition-colors group-hover:text-primary group-hover:underline underline-offset-2">
                        {user.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Level {user.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
