import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Award,
  Crown,
  Gem,
  Medal,
  Megaphone,
  Share2,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  pointsLedger,
  events,
  rewardRules,
  referrals,
} from "@/lib/collections";
import type { Event, RewardRule, PointsEntry } from "@/lib/types";
import {
  summarize,
  computeTier,
  computeBadges,
  type BadgeDef,
  type TierProgress,
} from "@/lib/points";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ReferralImpact from "@/components/ReferralImpact";
import MeCelebration from "@/components/MeCelebration";
import { T } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<PointsEntry["reason"], string> = {
  share: "Sharing",
  signup: "Referred sign-ups",
  checkin: "Referred check-ins",
};

interface EventBreakdown {
  eventId: string;
  total: number;
  byReason: Record<PointsEntry["reason"], number>;
}

// Tier visuals, indexed to match lib/points TIERS order.
const TIER_ICONS: LucideIcon[] = [Medal, Award, Trophy, Gem];
const TIER_BADGE_CLASS = [
  "bg-amber-700/15 text-amber-700",
  "bg-slate-400/20 text-slate-500",
  "bg-yellow-500/20 text-yellow-600",
  "bg-cyan-400/20 text-cyan-500",
];

const BADGE_ICONS: Record<string, LucideIcon> = {
  "first-share": Share2,
  connector: Users,
  "crowd-puller": Megaphone,
  "community-champion": Crown,
};

// Map badge keys → i18n keys for their display labels.
const BADGE_I18N: Record<string, string> = {
  "first-share": "badge.firstShare",
  connector: "badge.connector",
  "crowd-puller": "badge.crowdPuller",
  "community-champion": "badge.champion",
};

export default async function MePage() {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    redirect("/auth");
  }

  const ledgerCol = await pointsLedger();
  const entries = (await ledgerCol
    .find({ userId })
    .toArray()) as PointsEntry[];

  // ---- Per-event breakdown (for the reward-progress cards) -------------------
  const byEvent = new Map<string, EventBreakdown>();
  for (const e of entries) {
    let bucket = byEvent.get(e.eventId);
    if (!bucket) {
      bucket = {
        eventId: e.eventId,
        total: 0,
        byReason: { share: 0, signup: 0, checkin: 0 },
      };
      byEvent.set(e.eventId, bucket);
    }
    bucket.total += e.points;
    bucket.byReason[e.reason] += 1; // count of awards of this reason
  }

  const eventIds = Array.from(byEvent.keys());

  // ---- Look up event titles, reward rules, referral count -------------------
  const [eventDocs, ruleDocs, referralCount] = await Promise.all([
    eventIds.length
      ? ((await events()).find({ _id: { $in: eventIds } }).toArray() as Promise<
          Event[]
        >)
      : Promise.resolve([] as Event[]),
    eventIds.length
      ? ((await rewardRules())
          .find({ _id: { $in: eventIds } })
          .toArray() as Promise<RewardRule[]>)
      : Promise.resolve([] as RewardRule[]),
    (await referrals()).countDocuments({ referrerId: userId }),
  ]);

  // ---- Gamified summary (shared logic with /api/points) ---------------------
  const summary = summarize(entries, referralCount);
  const tier = computeTier(summary.totalPoints);
  const badges = computeBadges(summary);

  const eventTitles = new Map(eventDocs.map((e) => [e._id, e.title]));
  const rulesByEvent = new Map(ruleDocs.map((r) => [r._id, r]));

  const eventBreakdowns = Array.from(byEvent.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <div className="flex flex-col gap-8">
      <MeCelebration tier={tier.tier} tierIndex={tier.tierIndex} />

      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          <T k="points.title" />
        </h1>
        <p className="mt-1 text-muted-foreground">
          <T k="points.subtitle" />
        </p>
      </header>

      <TierCard points={summary.totalPoints} tier={tier} />

      <BadgesSection badges={badges} />

      <ReferralImpact />

      {/* Per-event reward progress */}
      {eventBreakdowns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="text-3xl" aria-hidden="true">
              🚀
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold">
                Start earning points by sharing events!
              </p>
              <p className="text-sm text-muted-foreground">
                Invite friends to events and earn points when they sign up and
                check in.
              </p>
            </div>
            <Button asChild>
              <Link href="/events">Browse events</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            <T k="points.byEvent" />
          </h2>
          {eventBreakdowns.map((b) => {
            const rule = rulesByEvent.get(b.eventId);
            const title = eventTitles.get(b.eventId) ?? "Untitled event";
            return (
              <EventCard
                key={b.eventId}
                title={title}
                breakdown={b}
                rule={rule}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TierCard({ points, tier }: { points: number; tier: TierProgress }) {
  const Icon = TIER_ICONS[tier.tierIndex] ?? Medal;
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                TIER_BADGE_CLASS[tier.tierIndex]
              )}
            >
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">
                <T k="points.currentTier" />
              </p>
              <p className="text-2xl font-bold">{tier.tier}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{points}</p>
            <p className="text-sm text-muted-foreground">
              <T k="points.totalPoints" />
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Progress value={tier.progressPct} />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{tier.tier}</span>
            {tier.nextTier ? (
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {tier.pointsToNext}
                </span>{" "}
                <T k="points.pointsTo" /> {tier.nextTier}
              </span>
            ) : (
              <span className="font-semibold text-primary">
                Top tier reached 🎉
              </span>
            )}
            <span className="font-semibold text-muted-foreground">
              {tier.nextTier ?? "Diamond"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BadgesSection({ badges }: { badges: BadgeDef[] }) {
  const earnedCount = badges.filter((b) => b.earned).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <T k="points.achievements" />
        </CardTitle>
        <CardDescription>
          <T
            k="points.badgesUnlocked"
            p={{ n: earnedCount, total: badges.length }}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {badges.map((b) => {
            const Icon = BADGE_ICONS[b.key] ?? Award;
            return (
              <div
                key={b.key}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                  b.earned
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/30 opacity-60 grayscale"
                )}
              >
                <span
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    b.earned
                      ? "bg-primary/20 text-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold">
                  {BADGE_I18N[b.key] ? <T k={BADGE_I18N[b.key]} /> : b.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {b.description}
                </span>
                {b.earned ? (
                  <Badge variant="solid" className="mt-1 text-[10px]">
                    Earned
                  </Badge>
                ) : (
                  b.progress && (
                    <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {Math.min(b.progress.current, b.progress.target)}/
                      {b.progress.target}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EventCard({
  title,
  breakdown,
  rule,
}: {
  title: string;
  breakdown: EventBreakdown;
  rule?: RewardRule;
}) {
  // Referred count tracked toward the reward is the number of awards matching
  // the rule's mode (sign-ups or check-ins).
  const referredCount = rule ? breakdown.byReason[rule.mode] : 0;
  const threshold = rule?.threshold ?? 0;
  const unlocked = !!rule && referredCount >= threshold;
  const progressValue =
    threshold > 0 ? Math.min(100, (referredCount / threshold) * 100) : 0;
  const noun = rule?.mode === "signup" ? "sign-ups" : "check-ins";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{breakdown.total} points earned</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rule ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {referredCount} of {threshold} referred {noun}
              </span>
              {unlocked && (
                <span className="font-medium text-primary">Complete</span>
              )}
            </div>
            <Progress value={progressValue} />
            {unlocked && (
              <p className="text-sm font-semibold text-primary">
                <T k="event.reward.unlocked" />: {rule.rewardLabel}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            <T k="points.noReward" />
          </p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(Object.keys(breakdown.byReason) as PointsEntry["reason"][])
            .filter((reason) => breakdown.byReason[reason] > 0)
            .map((reason) => (
              <span key={reason}>
                {REASON_LABELS[reason]}: {breakdown.byReason[reason]}
              </span>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
