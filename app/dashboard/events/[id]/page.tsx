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

export const dynamic = "force-dynamic";

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

  const ambassadors = await getReferralStats(event._id);

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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
