import Link from "next/link";
import { notFound } from "next/navigation";
import { events, registrations } from "@/lib/collections";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to My Events
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {event.title}
        </h1>
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
            See which members are driving the most sign-ups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-10 text-sm text-muted-foreground">
            Leaderboard coming soon
          </div>
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
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
