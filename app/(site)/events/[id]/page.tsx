import Link from "next/link";
import { notFound } from "next/navigation";
import { events, registrations } from "@/lib/collections";
import { Badge } from "@/components/ui/badge";
import RegisterButton from "@/components/RegisterButton";
import SharePanel from "@/components/SharePanel";

// Event + registration data is read from MongoDB at request time.
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(value?: Date) {
  if (!value) return "Date & time to be announced";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Date & time to be announced";
  return dateTimeFormatter.format(d);
}

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const eventsCol = await events();
  const event = await eventsCol.findOne({ _id: params.id });

  if (!event) {
    notFound();
  }

  const registrationsCol = await registrations();
  const registeredCount = await registrationsCol.countDocuments({
    eventId: params.id,
  });

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Cover */}
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={event.title}
          className="aspect-[16/9] w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700">
          <span className="px-6 text-center text-2xl font-bold text-primary-foreground">
            {event.title}
          </span>
        </div>
      )}

      {/* Header */}
      <header className="mt-8">
        {event.tags?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {event.title}
        </h1>

        <Link
          href={`/events/${event._id}/leaderboard`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          🏆 View referral leaderboard
        </Link>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </span>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                When
              </dt>
              <dd className="text-sm font-medium">
                {formatDateTime(event.startsAt)}
              </dd>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Where
                </dt>
                <dd className="text-sm font-medium">{event.location}</dd>
              </div>
            </div>
          )}
        </dl>
      </header>

      {/* Description */}
      {event.description && (
        <div className="mt-8 whitespace-pre-line leading-relaxed text-foreground/90">
          {event.description}
        </div>
      )}

      {/* Registration */}
      <section className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
        <RegisterButton eventId={event._id} eventTitle={event.title} />
      </section>

      {/* Referral sharing */}
      <section className="mt-6">
        <SharePanel eventId={event._id} />
      </section>

      {/* Who's going */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Who&rsquo;s going</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {registeredCount === 1
            ? "1 person registered"
            : `${registeredCount} people registered`}
        </p>
      </section>
    </article>
  );
}
