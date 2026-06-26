import Link from "next/link";
import { redirect } from "next/navigation";
import { events, registrations, pointsLedger } from "@/lib/collections";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BulkIngestForm from "@/components/BulkIngestForm";
import { SharePlatformChart } from "@/components/dashboard/SharePlatformChart";
import { buildPlatformBreakdown } from "@/lib/shareStats";
import type { PointsEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

// Deterministic sample distribution for organizers without real share data yet,
// so the demo dashboard always tells a story. Matched positionally to PLATFORMS
// (WhatsApp, Telegram, LinkedIn, X, Reddit, Discord).
const MOCK_SHARES = [45, 18, 28, 12, 5, 3];

function formatDate(d?: Date) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  const eventsCol = await events();
  const registrationsCol = await registrations();

  const list = await eventsCol
    .find({ organizerId: user._id })
    .sort({ startsAt: -1, createdAt: -1 })
    .toArray();

  const eventIds = list.map((e) => e._id);

  const stats = eventIds.length
    ? await registrationsCol
        .aggregate<{ _id: string; total: number; checkedIn: number }>([
          { $match: { eventId: { $in: eventIds } } },
          {
            $group: {
              _id: "$eventId",
              total: { $sum: 1 },
              checkedIn: {
                $sum: { $cond: [{ $eq: ["$checkedIn", true] }, 1, 0] },
              },
            },
          },
        ])
        .toArray()
    : [];

  const statsByEvent = new Map(stats.map((s) => [s._id, s]));

  const totalRegistrations = stats.reduce((sum, s) => sum + s.total, 0);
  const totalCheckins = stats.reduce((sum, s) => sum + s.checkedIn, 0);

  // ---- Global share analytics across all of this organizer's events --------
  const ledgerCol = await pointsLedger();
  const ledgerEntries = eventIds.length
    ? ((await ledgerCol
        .find({ eventId: { $in: eventIds } })
        .toArray()) as PointsEntry[])
    : [];

  const shareEntries = ledgerEntries.filter((e) => e.reason === "share");
  const { breakdown: sharePlatforms, totalShares, isMock: sharesAreMock } =
    buildPlatformBreakdown(shareEntries, MOCK_SHARES);

  // Driven-by-referral totals come from the points ledger (not registrations).
  const signupsDriven = ledgerEntries.filter((e) => e.reason === "signup").length;
  const checkinsDriven = ledgerEntries.filter((e) => e.reason === "checkin").length;
  const topPlatform = sharePlatforms[0]?.label ?? "—";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the events you organize and track turnout.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/events/new">Create Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Events" value={list.length} />
        <StatCard label="Registrations" value={totalRegistrations} />
        <StatCard label="Check-ins" value={totalCheckins} />
      </div>

      {/* Share Activity — aggregated across every event this organizer owns. */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Share Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How your community is spreading the word across all your events
            {sharesAreMock ? " (sample data)" : ""}.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total shares" value={totalShares} />
          <StatCard label="Signups driven" value={signupsDriven} />
          <StatCard label="Check-ins driven" value={checkinsDriven} />
          <StatCard label="Best platform" value={topPlatform} />
        </div>

        <SharePlatformChart
          title="Most used share platforms"
          description="Which channels drive the most sharing across all your events"
          platform={sharePlatforms}
          isMock={sharesAreMock}
        />
      </section>

      <BulkIngestForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <span className="text-3xl" aria-hidden="true">
                📅
              </span>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  No events yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first event to start tracking turnout.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/events/new">Create your first event</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 text-right font-medium">
                      Registrations
                    </th>
                    <th className="px-6 py-3 text-right font-medium">
                      Check-ins
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((event) => {
                    const s = statsByEvent.get(event._id);
                    return (
                      <tr
                        key={event._id}
                        className="border-b border-border last:border-0 hover:bg-secondary/40"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/events/${event._id}`}
                            className="font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {event.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(event.startsAt)}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums">
                          {s?.total ?? 0}
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums">
                          {s?.checkedIn ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
