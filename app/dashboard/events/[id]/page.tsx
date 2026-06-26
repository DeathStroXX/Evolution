import Link from "next/link";
import { notFound } from "next/navigation";
import {
  events,
  registrations,
  referrals,
  profiles,
  pointsLedger,
} from "@/lib/collections";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EventAnalytics,
  type PlatformDatum,
  type AnalyticsRow,
} from "@/components/dashboard/EventAnalytics";

export const dynamic = "force-dynamic";

/** Share platforms we track, in display order. */
const PLATFORMS: { key: string; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
  { key: "reddit", label: "Reddit" },
  { key: "discord", label: "Discord" },
];
const PLATFORM_LABEL = new Map(PLATFORMS.map((p) => [p.key, p.label]));

function formatDate(d?: Date) {
  if (!d) return "Date to be announced";
  return new Date(d).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const eventsCol = await events();
  const registrationsCol = await registrations();

  const event = await eventsCol.findOne({ _id: params.id });
  if (!event) notFound();

  const [registrationCount, checkinCount] = await Promise.all([
    registrationsCol.countDocuments({ eventId: event._id }),
    registrationsCol.countDocuments({ eventId: event._id, checkedIn: true }),
  ]);

  const [ambassadors, shareStats] = await Promise.all([
    getReferralStats(event._id),
    getShareAnalytics(event._id),
  ]);

  const analyticsRows: AnalyticsRow[] = ambassadors.map((a) => ({
    name: a.name,
    email: a.email,
    signups: a.signups,
    checkins: a.checkins,
    platform: shareStats.platformByReferrer.get(a.referrerId) ?? "—",
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to My Events
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {event.title}
          </h1>
          <Button asChild variant="outline" className="shrink-0">
            <Link href={`/dashboard/events/${event._id}/rewards`}>
              Reward rules
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(event.startsAt)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Registrations" value={registrationCount} />
        <StatCard label="Check-ins" value={checkinCount} />
        <StatCard
          label="Seat limit"
          value={event.seatLimit ?? "—"}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Analytics
        </h2>
        <EventAnalytics
          platform={shareStats.platformBreakdown}
          funnel={{
            shares: shareStats.totalShares,
            registrations: registrationCount,
            checkins: checkinCount,
          }}
          rows={analyticsRows}
          isMockPlatform={shareStats.isMock}
          eventTitle={event.title}
        />
      </div>

      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {event.description}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral leaderboard</CardTitle>
          <CardDescription>
            Your top community ambassadors — who&rsquo;s driving the most
            sign-ups and check-ins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ambassadors.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-10 text-sm text-muted-foreground">
              No referral activity yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Referrer</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 text-right font-medium">Signups</th>
                    <th className="py-2 pr-4 text-right font-medium">
                      Check-ins
                    </th>
                    <th className="py-2 pr-4 text-right font-medium">Points</th>
                    <th className="py-2 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {ambassadors.map((a) => (
                    <tr
                      key={a.referrerId}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {a.name}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {a.email}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {a.signups}
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        {a.checkins}
                      </td>
                      <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                        {a.points}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {a.lastActive ? formatRelative(a.lastActive) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AmbassadorRow {
  referrerId: string;
  name: string;
  email: string;
  signups: number;
  checkins: number;
  points: number;
  lastActive: Date | null;
}

/**
 * Build per-referrer analytics for an event: sign-ups and check-ins they
 * drove (via their referral code), total points earned, and when they were
 * last active. Sorted by check-ins driven, descending.
 */
async function getReferralStats(eventId: string): Promise<AmbassadorRow[]> {
  const [referralsCol, registrationsCol, profilesCol, ledgerCol] =
    await Promise.all([
      referrals(),
      registrations(),
      profiles(),
      pointsLedger(),
    ]);

  const eventReferrals = await referralsCol.find({ eventId }).toArray();
  if (eventReferrals.length === 0) return [];

  const referrerIds = eventReferrals.map((r) => r.referrerId);
  const codes = eventReferrals.map((r) => r.code);

  const [referredRegs, ledgerEntries, profileDocs] = await Promise.all([
    registrationsCol.find({ eventId, referralCode: { $in: codes } }).toArray(),
    ledgerCol.find({ eventId, userId: { $in: referrerIds } }).toArray(),
    profilesCol.find({ _id: { $in: referrerIds } }).toArray(),
  ]);

  const profileById = new Map(profileDocs.map((p) => [p._id, p]));

  const rows: AmbassadorRow[] = eventReferrals.map((ref) => {
    const regs = referredRegs.filter((r) => r.referralCode === ref.code);
    const entries = ledgerEntries.filter((e) => e.userId === ref.referrerId);

    let lastActive: Date | null = null;
    let points = 0;
    for (const e of entries) {
      points += e.points;
      const at = new Date(e.createdAt);
      if (!lastActive || at > lastActive) lastActive = at;
    }

    const profile = profileById.get(ref.referrerId);
    return {
      referrerId: ref.referrerId,
      name: profile?.name || "Unknown member",
      email: profile?.email || "—",
      signups: regs.length,
      checkins: regs.filter((r) => r.checkedIn).length,
      points,
      lastActive,
    };
  });

  rows.sort((a, b) => b.checkins - a.checkins);
  return rows;
}

interface ShareAnalytics {
  platformBreakdown: PlatformDatum[];
  totalShares: number;
  isMock: boolean;
  /** referrerId -> the platform label they share through most. */
  platformByReferrer: Map<string, string>;
}

/**
 * Aggregate share activity for an event into a per-platform breakdown plus the
 * dominant platform per referrer. Share platform lives on `reason: "share"`
 * ledger entries (newer docs carry a `platform` field; older ones encode it in
 * the dedupeKey). When an event has no real shares yet, returns demo data so the
 * organizer dashboard still tells a story.
 */
async function getShareAnalytics(eventId: string): Promise<ShareAnalytics> {
  const ledgerCol = await pointsLedger();
  const shareEntries = await ledgerCol
    .find({ eventId, reason: "share" })
    .toArray();

  const counts = new Map<string, number>();
  // referrerId -> per-platform tally, to pick their top channel.
  const perReferrer = new Map<string, Map<string, number>>();

  for (const entry of shareEntries) {
    const platform = entry.platform ?? platformFromDedupeKey(entry.dedupeKey);
    if (!platform || !PLATFORM_LABEL.has(platform)) continue;

    counts.set(platform, (counts.get(platform) ?? 0) + 1);

    const byPlatform = perReferrer.get(entry.userId) ?? new Map();
    byPlatform.set(platform, (byPlatform.get(platform) ?? 0) + 1);
    perReferrer.set(entry.userId, byPlatform);
  }

  const platformByReferrer = new Map<string, string>();
  Array.from(perReferrer.entries()).forEach(([referrerId, byPlatform]) => {
    let top = "";
    let topCount = 0;
    Array.from(byPlatform.entries()).forEach(([platform, count]) => {
      if (count > topCount) {
        top = platform;
        topCount = count;
      }
    });
    if (top) platformByReferrer.set(referrerId, PLATFORM_LABEL.get(top)!);
  });

  const real = shareEntries.length > 0;
  // Deterministic sample distribution for empty events.
  const MOCK = [18, 12, 9, 7, 5, 3];
  const breakdown: PlatformDatum[] = PLATFORMS.map((p, i) => ({
    key: p.key,
    label: p.label,
    count: real ? counts.get(p.key) ?? 0 : MOCK[i] ?? 0,
  }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalShares = breakdown.reduce((sum, p) => sum + p.count, 0);

  return {
    platformBreakdown: breakdown,
    totalShares,
    isMock: !real,
    platformByReferrer,
  };
}

/** Extract the trailing platform segment from `share:user:event:platform`. */
function platformFromDedupeKey(dedupeKey: string): string | null {
  if (!dedupeKey.startsWith("share:")) return null;
  const parts = dedupeKey.split(":");
  return parts.length >= 4 ? parts[parts.length - 1] : null;
}

function formatRelative(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <span className="inline-block h-1.5 w-8 rounded-full bg-primary" />
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
