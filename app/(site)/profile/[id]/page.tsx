import { notFound } from "next/navigation";
import { profiles, pointsLedger } from "@/lib/collections";
import { cn } from "@/lib/utils";
import { Gem, Crown, Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

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

function getNextLevelThreshold(level: number) {
  if (level === 0) return 1;
  if (level === 1) return 5;
  if (level === 2) return 10;
  if (level === 3) return 15;
  if (level === 4) return 20;
  return 20; // Maxed
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profileCol = await profiles();
  const ledgerCol = await pointsLedger();

  const profile = await profileCol.findOne({ _id: params.id });
  if (!profile) {
    notFound();
  }

  const name = profile.name?.trim() || "Anonymous Member";

  const points = await ledgerCol
    .find({ userId: params.id, reason: "signup" })
    .toArray();

  const totalReferrals = points.length;
  const level = getLevel(totalReferrals);
  const nextThreshold = getNextLevelThreshold(level);
  
  // Calculate progress percentage
  let progressPercent = 100;
  if (level < 5) {
    const prevThreshold = level === 0 ? 0 : getNextLevelThreshold(level - 1);
    const requiredForNext = nextThreshold - prevThreshold;
    const currentProgress = totalReferrals - prevThreshold;
    progressPercent = Math.round((currentProgress / requiredForNext) * 100);
  }

  // Calculate Last 7 Days Graph Data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: 0,
    };
  });

  for (const p of points) {
    const dStr = new Date(p.createdAt).toISOString().split("T")[0];
    const day = last7Days.find((d) => d.date === dStr);
    if (day) day.count++;
  }

  const maxCountInGraph = Math.max(...last7Days.map((d) => d.count), 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <span
            className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-lg",
              colorFor(name)
            )}
          >
            {name.charAt(0).toUpperCase()}
          </span>
          {level >= 4 && (
            <div className="absolute -right-2 -top-2 flex h-8 w-8 animate-bounce items-center justify-center rounded-full bg-yellow-400 text-yellow-900 shadow-md">
              <Crown size={16} strokeWidth={3} />
            </div>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">{name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge level={level} />
          {level > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              <Gem size={14} className="text-blue-600" />
              {totalReferrals} Gems
            </span>
          )}
        </div>
        <p className="mt-3 text-muted-foreground">
          {profile.interests?.length > 0
            ? `Interested in ${profile.interests.join(", ")}`
            : "A valued member of the Mainfranken Community."}
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {/* Progress Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="text-primary" size={20} />
              <h2 className="text-lg font-semibold">Community Progress</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {level >= 5
                ? "Max level reached! You are a community legend."
                : `Progress to Level ${level + 1}`}
            </p>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>Level {level}</span>
              {level < 5 && <span>Level {level + 1}</span>}
            </div>
            <Progress value={progressPercent} className="h-3 w-full" />
            {level < 5 && (
              <p className="mt-3 text-xs text-muted-foreground">
                {nextThreshold - totalReferrals} more referrals to rank up!
              </p>
            )}
          </div>
        </div>

        {/* Gamification Stats */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-primary">Achievements</h2>
            <p className="mt-1 text-sm text-primary/70">
              Rewards earned for bringing people to the hackathon.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110"
                title={`Level ${i + 1} Unlocked`}
              >
                <Gem className="text-blue-500" size={20} />
              </div>
            ))}
            {level === 0 && (
              <p className="text-sm italic text-muted-foreground">
                Bring a friend to earn your first gem!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-muted-foreground" size={20} />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <p className="mt-1 mb-8 text-sm text-muted-foreground">
          Number of friends brought over the last 7 days.
        </p>
        
        <div className="flex h-40 items-end justify-between gap-2 px-2 sm:px-6">
          {last7Days.map((day, i) => {
            const heightPercent = (day.count / maxCountInGraph) * 100;
            return (
              <div key={i} className="group flex w-full flex-col items-center gap-2">
                <div className="relative flex w-full flex-1 items-end justify-center rounded-t-sm bg-secondary/30">
                  <div
                    className="w-full rounded-t-sm bg-primary transition-all duration-500 ease-out group-hover:bg-primary/80"
                    style={{ height: `${heightPercent}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                  />
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute -top-8 hidden rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                    {day.count} referrals
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{day.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Badge({ level }: { level: number }) {
  if (level === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
        Starter
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      Level {level}
    </span>
  );
}
