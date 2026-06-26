"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Pref {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const PREFERENCES: Pref[] = [
  {
    key: "new_registration",
    label: "New registration",
    description: "Get an email each time someone registers for one of your events.",
    defaultOn: true,
  },
  {
    key: "reward_threshold",
    label: "Reward threshold crossed",
    description:
      "Know the moment an ambassador unlocks one of your reward tiers.",
    defaultOn: true,
  },
  {
    key: "weekly_digest",
    label: "Weekly digest",
    description: "A Monday-morning summary of last week's growth across events.",
    defaultOn: true,
  },
  {
    key: "milestones",
    label: "Registration milestones",
    description: "Celebrate as each event passes 10, 25, 50 and 100 sign-ups.",
    defaultOn: false,
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PREFERENCES.map((p) => [p.key, p.defaultOn]))
  );

  function toggle(key: string) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
          Notification preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose which emails we send you. Preferences are saved per organizer
          account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email notifications</CardTitle>
          <CardDescription>
            We&rsquo;ll only send what you opt into below.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {PREFERENCES.map((p) => (
            <div
              key={p.key}
              className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">{p.label}</p>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
              <Toggle
                on={prefs[p.key]}
                onToggle={() => toggle(p.key)}
                label={p.label}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Email preview
          </h2>
          <p className="text-sm text-muted-foreground">
            A look at what these emails would feel like in your inbox.
          </p>
        </div>

        <EmailPreview
          subject="🎟️ New registration: Priya joined React Würzburg Meetup"
          from="Mainfranken Community Connect"
          muted={!prefs.new_registration}
        >
          <p>Hi there,</p>
          <p>
            <strong>Priya Sharma</strong> just registered for{" "}
            <strong>React Würzburg Meetup</strong>.
          </p>
          <p>
            They came through <strong>Lukas Bauer&rsquo;s</strong> referral link
            — that&rsquo;s another sign-up driven by one of your ambassadors. 🙌
          </p>
          <p className="text-muted-foreground">
            42 of 80 seats filled · 12 check-ins so far
          </p>
        </EmailPreview>

        <EmailPreview
          subject="📊 Your weekly digest — React Würzburg Meetup"
          from="Mainfranken Community Connect"
          muted={!prefs.weekly_digest}
        >
          <p>Good morning,</p>
          <p>Here&rsquo;s how your community moved last week:</p>
          <ul className="my-1 space-y-1">
            <li>
              • <strong>23 new registrations</strong> (+18% vs. the week before)
            </li>
            <li>
              • Top referrer: <strong>Lukas Bauer</strong> with 9 sign-ups driven
            </li>
            <li>
              • Check-in rate: <strong>71%</strong> across last week&rsquo;s events
            </li>
          </ul>
          <p className="text-muted-foreground">
            Keep the momentum going — share your event link in your community
            channels.
          </p>
        </EmailPreview>

        <EmailPreview
          subject="🏆 Reward unlocked: Lukas crossed 10 sign-ups"
          from="Mainfranken Community Connect"
          muted={!prefs.reward_threshold}
        >
          <p>Nice work building your community!</p>
          <p>
            <strong>Lukas Bauer</strong> just crossed the{" "}
            <strong>10 sign-ups</strong> threshold for{" "}
            <strong>React Würzburg Meetup</strong> and earned the{" "}
            <strong>&ldquo;Free ticket + front-row seat&rdquo;</strong> reward.
          </p>
          <p className="text-muted-foreground">
            We&rsquo;ve flagged it on your dashboard so you can hand it over at
            check-in.
          </p>
        </EmailPreview>
      </div>
    </div>
  );
}

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Toggle ${label}`}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-primary" : "bg-neutral-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function EmailPreview({
  subject,
  from,
  muted,
  children,
}: {
  subject: string;
  from: string;
  muted: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={muted ? "opacity-55" : undefined}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              IT
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {from}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                to you · noreply@community-connect.de
              </p>
            </div>
          </div>
          {muted && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              Off
            </span>
          )}
        </div>
        <div className="space-y-2 px-5 py-4">
          <p className="text-sm font-semibold text-foreground">{subject}</p>
          <div className="space-y-2 text-sm leading-relaxed text-foreground/90">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
