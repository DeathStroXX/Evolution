"use client";

import { useEffect, useState } from "react";

interface LeaderRow {
  userId: string;
  name: string;
  count: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Public "Top referrers" card for an event — the members who brought the most
 * people. Visible to everyone. Renders nothing when there are no referrals yet.
 *
 * Carries its own top margin so it leaves no gap when it renders nothing.
 */
export default function EventLeaderboardPublic({
  eventId,
}: {
  eventId: string;
}) {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leaderboard?eventId=${encodeURIComponent(eventId)}&limit=3`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.rows)) {
          setRows(data.rows);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (!rows || rows.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-block h-5 w-1.5 rounded-full bg-primary"
        />
        <h2 className="text-lg font-semibold">Top referrers</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Community members bringing the most people to this event.
      </p>

      <ol className="mt-4 flex flex-col gap-2">
        {rows.map((row, i) => (
          <li
            key={row.userId}
            className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-foreground"
              aria-label={`Rank ${i + 1}`}
            >
              {MEDALS[i] ?? i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">
              {row.name}
            </span>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {row.count} {row.count === 1 ? "person" : "people"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
