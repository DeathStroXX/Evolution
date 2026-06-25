import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  pointsLedger,
  events,
  rewardRules,
  referrals,
} from "@/lib/collections";
import type { Event, RewardRule, PointsEntry } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

export default async function MePage() {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    redirect("/auth");
  }

  const ledgerCol = await pointsLedger();
  const entries = (await ledgerCol
    .find({ userId })
    .toArray()) as PointsEntry[];

  // ---- Aggregate the ledger -------------------------------------------------
  let totalPoints = 0;
  const byReason: Record<PointsEntry["reason"], number> = {
    share: 0,
    signup: 0,
    checkin: 0,
  };
  const byEvent = new Map<string, EventBreakdown>();

  for (const e of entries) {
    totalPoints += e.points;
    byReason[e.reason] = (byReason[e.reason] ?? 0) + e.points;

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

  // ---- Look up related event titles, reward rules, referral count -----------
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

  const eventTitles = new Map(eventDocs.map((e) => [e._id, e.title]));
  const rulesByEvent = new Map(ruleDocs.map((r) => [r._id, r]));

  const eventBreakdowns = Array.from(byEvent.values()).sort(
    (a, b) => b.total - a.total
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Your points</h1>
        <p className="mt-1 text-muted-foreground">
          Track the points you&rsquo;ve earned and the rewards you&rsquo;ve
          unlocked.
        </p>
      </header>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <SummaryStat label="Total points" value={totalPoints} accent />
            <SummaryStat label="Events participated" value={eventIds.length} />
            <SummaryStat label="Referrals made" value={referralCount} />
          </div>

          {totalPoints > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {(Object.keys(byReason) as PointsEntry["reason"][])
                .filter((reason) => byReason[reason] > 0)
                .map((reason) => (
                  <span key={reason}>
                    {REASON_LABELS[reason]}:{" "}
                    <span className="font-medium text-foreground">
                      {byReason[reason]} pts
                    </span>
                  </span>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-event breakdown */}
      {eventBreakdowns.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You haven&rsquo;t earned any points yet. Share an event to get
            started!
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">By event</h2>
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

function SummaryStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={
          accent
            ? "text-3xl font-bold text-green-600"
            : "text-3xl font-bold"
        }
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
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
                <span className="font-medium text-green-600">Complete</span>
              )}
            </div>
            <Progress value={progressValue} />
            {unlocked && (
              <p className="text-sm font-semibold text-green-600">
                Reward unlocked: {rule.rewardLabel}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No reward set for this event yet.
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
