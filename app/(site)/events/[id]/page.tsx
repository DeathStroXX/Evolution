import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift } from "lucide-react";
import {
  events,
  registrations,
  profiles,
  rewardRules,
} from "@/lib/collections";
import { Badge } from "@/components/ui/badge";
import RegisterButton from "@/components/RegisterButton";
import SharePanel from "@/components/SharePanel";
import ReferralBanner from "@/components/ReferralBanner";
import EventLeaderboardPublic from "@/components/EventLeaderboardPublic";

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

// Concise variant for the share message (e.g. "Mon, Jan 5, 6:00 PM").
const shareDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatShareDate(value?: Date) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : shareDateFormatter.format(d);
}

function formatDateTime(value?: Date) {
  if (!value) return "Date & time to be announced";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "Date & time to be announced";
  return dateTimeFormatter.format(d);
}

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

  // Reward rule for this event (if the organizer set one). Serialized down to
  // a plain object so it can cross into the client components below.
  const rewardRulesCol = await rewardRules();
  const rewardDoc = await rewardRulesCol.findOne({ _id: params.id });
  const reward = rewardDoc
    ? {
        mode: rewardDoc.mode,
        threshold: rewardDoc.threshold,
        rewardLabel: rewardDoc.rewardLabel,
      }
    : null;

  const registrationsCol = await registrations();
  const regs = await registrationsCol
    .find({ eventId: params.id }, { projection: { userId: 1 } })
    .toArray();
  const registeredCount = regs.length;

  // Resolve a few registrant display names for the "Who's going" avatars.
  const userIds = Array.from(
    new Set(regs.map((r) => r.userId).filter(Boolean))
  );
  const profileCol = await profiles();
  const profileDocs = await profileCol
    .find({ _id: { $in: userIds } }, { projection: { name: 1 } })
    .toArray();
  const registrantNames = profileDocs
    .map((p) => p.name?.trim())
    .filter((n): n is string => Boolean(n));
  const shownNames = registrantNames.slice(0, 5);
  const moreCount = registeredCount - shownNames.length;

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* "[Name] invited you" — shown only when arriving via a ?ref= link */}
      <ReferralBanner />

      {/* Cover */}
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={event.title}
          className="aspect-[16/9] w-full rounded-2xl object-cover"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-border bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/40"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
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
          className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary/20"
        >
          🏆 View referral leaderboard
        </Link>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 text-foreground/50"
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
              <span aria-hidden="true" className="mt-0.5 text-foreground/50">
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

      {/* Public top referrers — hidden until the event has referrals */}
      <EventLeaderboardPublic eventId={event._id} />

      {/* Reward callout — prominent, lime-accented, above the register CTA */}
      {reward && (
        <section className="mt-10 flex items-start gap-4 rounded-2xl border-2 border-primary bg-primary/10 p-6 sm:p-8">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Gift className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Referral reward
            </p>
            <p className="text-xl font-bold leading-tight text-foreground">
              {reward.rewardLabel}
            </p>
            <p className="text-sm font-medium text-foreground/80">
              Refer {reward.threshold} friend{reward.threshold === 1 ? "" : "s"}{" "}
              to earn {reward.rewardLabel}.
            </p>
          </div>
        </section>
      )}

      {/* Registration */}
      <section className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
        <RegisterButton
          eventId={event._id}
          eventTitle={event.title}
          reward={reward}
        />
      </section>

      {/* Referral sharing */}
      <section id="share" className="mt-6 scroll-mt-8">
        <SharePanel
          eventId={event._id}
          eventTitle={event.title}
          eventDate={formatShareDate(event.startsAt)}
          eventLocation={event.location}
          reward={reward}
        />
      </section>

      {/* Who's going */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Who&rsquo;s going</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {registeredCount === 1
            ? "1 person registered"
            : `${registeredCount} people registered`}
        </p>

        {shownNames.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex -space-x-2">
              {shownNames.map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  title={name}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-background ${colorFor(
                    name
                  )}`}
                >
                  {name.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
            {moreCount > 0 && (
              <span className="text-sm text-muted-foreground">
                and {moreCount} more
              </span>
            )}
          </div>
        )}
      </section>
    </article>
  );
}
