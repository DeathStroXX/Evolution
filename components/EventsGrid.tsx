"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SerializedEvent {
  _id: string;
  title: string;
  description?: string;
  startsAt?: string;
  location?: string;
  imageUrl?: string;
  coverImage?: string;
  tags: string[];
}

export interface EventSocial {
  count: number;
  names: string[];
}

const FILTERS = ["All", "AI", "IT", "Startup", "Design", "Community"] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(iso?: string) {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return dateFormatter.format(d);
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

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      title={name}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white",
        colorFor(name)
      )}
    >
      {initial(name)}
    </span>
  );
}

interface RewardRuleLite {
  threshold: number;
  rewardLabel: string;
}

// Fetches the event's reward rule (if any) and renders a small banner at the
// bottom of the card. Renders nothing when the event has no reward.
function RewardBanner({ eventId }: { eventId: string }) {
  const [rule, setRule] = useState<RewardRuleLite | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reward-rules?eventId=${encodeURIComponent(eventId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.rewardLabel !== "string") return;
        setRule({ threshold: data.threshold, rewardLabel: data.rewardLabel });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!rule) return null;

  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border bg-primary/10 px-6 py-3 text-sm font-semibold text-foreground">
      <span aria-hidden="true">🎁</span>
      <span className="line-clamp-1">
        {rule.rewardLabel} for {rule.threshold} referral
        {rule.threshold === 1 ? "" : "s"}
      </span>
    </div>
  );
}

// Lime-tinted gradient shown when an event has no cover image. Image-forward,
// Luma-style — no calendar icon, just a soft brand wash.
function CoverPlaceholder({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-[2/1] w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background"
    >
      <span className="text-3xl font-black uppercase text-primary/40">
        {initial(title)}
      </span>
    </div>
  );
}

export default function EventsGrid({
  events,
  social = {},
  registeredEventIds = [],
}: {
  events: SerializedEvent[];
  social?: Record<string, EventSocial>;
  registeredEventIds?: string[];
}) {
  const [active, setActive] = useState<string>("All");

  const registeredSet = useMemo(
    () => new Set(registeredEventIds),
    [registeredEventIds]
  );

  const filtered = useMemo(() => {
    if (active === "All") return events;
    const needle = active.toLowerCase();
    return events.filter((e) =>
      (e.tags ?? []).some((t) => t.toLowerCase() === needle)
    );
  }, [events, active]);

  return (
    <div className="space-y-8">
      {/* Tag filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = active === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActive(filter)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-foreground/70 hover:border-primary hover:text-foreground"
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-2xl" aria-hidden="true">
            🔍
          </p>
          <p className="mt-3 text-lg font-semibold">
            No events match your filters
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different category to see more events.
          </p>
          {active !== "All" && (
            <button
              type="button"
              onClick={() => setActive("All")}
              className="mt-5 inline-flex items-center rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const proof = social[event._id];
            const isRegistered = registeredSet.has(event._id);
            return (
            <Link
              key={event._id}
              href={`/events/${event._id}`}
              className="group block focus:outline-none"
            >
              <Card className="relative flex h-full flex-col overflow-hidden rounded-xl border-border shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                {isRegistered && (
                  <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
                    Registered ✓
                  </span>
                )}
                {/* Cover image / placeholder */}
                {event.coverImage || event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.coverImage || event.imageUrl}
                    alt={event.title}
                    loading="lazy"
                    className="aspect-[2/1] w-full bg-muted object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <CoverPlaceholder title={event.title} />
                )}

                <CardHeader className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatDate(event.startsAt)}
                  </p>
                  <CardTitle className="line-clamp-2 text-lg font-bold leading-snug transition-colors group-hover:text-foreground">
                    {event.title}
                  </CardTitle>
                  {event.location && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.location}
                    </p>
                  )}
                </CardHeader>

                {event.tags?.length > 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                )}

                {/* Social proof — who's going */}
                {proof && proof.count > 0 && (
                  <div className="mt-auto flex items-center gap-3 border-t border-border px-6 py-4">
                    <div className="flex -space-x-2">
                      {proof.names.slice(0, 3).map((name, i) => (
                        <Avatar key={`${name}-${i}`} name={name} />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {proof.count === 1 ? "1 going" : `${proof.count} going`}
                    </span>
                  </div>
                )}

                {/* Reward banner — surfaces the event's referral reward */}
                <RewardBanner eventId={event._id} />
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
