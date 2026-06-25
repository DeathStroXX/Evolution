import Link from "next/link";
import { redirect } from "next/navigation";
import { events, registrations } from "@/lib/collections";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the events you organize and track turnout.
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/dashboard/events/new">Create Event</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Events" value={list.length} />
        <StatCard label="Registrations" value={totalRegistrations} />
        <StatCard label="Check-ins" value={totalCheckins} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              You haven&apos;t created any events yet.{" "}
              <Link
                href="/dashboard/events/new"
                className="font-medium text-green-700 hover:underline"
              >
                Create your first event
              </Link>
              .
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
                            className="font-medium text-foreground hover:text-green-700 hover:underline"
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

function StatCard({ label, value }: { label: string; value: number }) {
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
