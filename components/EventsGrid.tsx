"use client";

import { useMemo, useState } from "react";
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

function CalendarPlaceholder() {
  return (
    <div className="flex aspect-[16/9] w-full items-center justify-center border-b border-border bg-muted">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted-foreground/50"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
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
        <p className="py-16 text-center text-muted-foreground">
          No events match this filter.
        </p>
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
              <Card className="relative flex h-full flex-col overflow-hidden border-border transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                {isRegistered && (
                  <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow">
                    Registered ✓
                  </span>
                )}
                {/* Cover image / placeholder */}
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="aspect-[16/9] w-full border-b border-border object-cover"
                  />
                ) : (
                  <CalendarPlaceholder />
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
              </Card>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
