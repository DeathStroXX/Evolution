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

export default function EventsGrid({ events }: { events: SerializedEvent[] }) {
  const [active, setActive] = useState<string>("All");

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
                  : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-primary"
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
          {filtered.map((event) => (
            <Link
              key={event._id}
              href={`/events/${event._id}`}
              className="group block focus:outline-none"
            >
              <Card className="h-full overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-ring">
                {/* Cover image / placeholder */}
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-primary to-emerald-700">
                    <span className="px-4 text-center text-lg font-semibold text-primary-foreground">
                      {event.title}
                    </span>
                  </div>
                )}

                <CardHeader className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {formatDate(event.startsAt)}
                  </p>
                  <CardTitle className="line-clamp-2 text-lg leading-snug">
                    {event.title}
                  </CardTitle>
                  {event.location && (
                    <p className="text-sm text-muted-foreground">
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
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
