"use client";

import { useEffect, useState } from "react";

interface ActivityItem {
  userName: string;
  action: string;
  eventTitle: string;
  timestamp: string; // ISO
}

const ROTATE_MS = 3500;

// Emoji cue per action, with a sensible default. Keys match the connector
// phrases the API returns (all from the referrer's perspective).
const ACTION_EMOJI: Record<string, string> = {
  "got a friend to sign up for": "🚀",
  shared: "🔗",
  "'s referral checked in at": "📍",
};

/**
 * Hardcoded, realistic-looking entries used during a pitch when the DB has too
 * little real activity to feel alive. Timestamps are built relative to load
 * time so the relative labels ("2 min ago") always read naturally.
 */
function buildPlaceholders(): ActivityItem[] {
  const now = Date.now();
  const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
  return [
    {
      userName: "Anna",
      action: "got a friend to sign up for",
      eventTitle: "AI Week Mainfranken",
      timestamp: ago(2),
    },
    {
      userName: "Jonas",
      action: "shared",
      eventTitle: "Würzburg Web Dev Meetup",
      timestamp: ago(8),
    },
    {
      userName: "Lena",
      action: "'s referral checked in at",
      eventTitle: "Startup Night Schweinfurt",
      timestamp: ago(15),
    },
    {
      userName: "Maximilian",
      action: "got a friend to sign up for",
      eventTitle: "Cloud & DevOps Day",
      timestamp: ago(26),
    },
    {
      userName: "Sophie",
      action: "shared",
      eventTitle: "UX Design Workshop",
      timestamp: ago(41),
    },
  ];
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, (Date.now() - then) / 1000);

  if (seconds < 45) return "just now";
  if (seconds < 90) return "1 min ago";
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`;
  if (seconds < 5400) return "1 hr ago";
  if (seconds < 86_400) return `${Math.round(seconds / 3600)} hr ago`;
  const days = Math.round(seconds / 86_400);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

type State =
  | { status: "loading" }
  | { status: "hidden" }
  | { status: "ready"; items: ActivityItem[] };

export default function ActivityTicker() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [index, setIndex] = useState(0);

  // Fetch once on mount. Fall back to placeholders when activity is sparse so
  // the ticker always looks alive during a demo.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as { items?: ActivityItem[] };
        if (cancelled) return;

        const real = Array.isArray(data.items) ? data.items : [];
        const items = real.length >= 3 ? real : buildPlaceholders();
        setState({ status: "ready", items });
      } catch {
        // Endpoint unreachable / no data — show nothing.
        if (!cancelled) setState({ status: "hidden" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Rotate entries on an interval once we have more than one.
  const count = state.status === "ready" ? state.items.length : 0;
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (state.status !== "ready" || state.items.length === 0) return null;

  const item = state.items[index % state.items.length];
  const emoji = ACTION_EMOJI[item.action] ?? "✨";

  return (
    <div className="mb-6 flex items-center gap-3 overflow-hidden rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
      <span className="flex shrink-0 items-center gap-1.5 font-semibold uppercase tracking-wide text-primary">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="hidden text-[11px] sm:inline">Live</span>
      </span>

      {/* key={index} remounts the line so the CSS enter animation replays. */}
      <p
        key={index}
        className="animate-activity-ticker-in min-w-0 flex-1 truncate text-foreground"
        aria-live="polite"
      >
        <span aria-hidden="true">{emoji} </span>
        <span className="font-semibold text-primary">{item.userName}</span>
        <span className="text-muted-foreground">
          {/* Possessive phrases ("'s referral…") attach with no space. */}
          {item.action.startsWith("'") ? "" : " "}
          {item.action}{" "}
        </span>
        <span className="font-medium text-foreground">{item.eventTitle}</span>
        <span className="text-muted-foreground">
          {" "}
          — {relativeTime(item.timestamp)}
        </span>
      </p>
    </div>
  );
}
