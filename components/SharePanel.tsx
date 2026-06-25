"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Status = "loading" | "anonymous" | "ready" | "error";

export interface EventReward {
  mode: "signup" | "checkin";
  threshold: number;
  rewardLabel: string;
}

function extractUserId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const user = (d.user as Record<string, unknown>) ?? d;
  const id = user._id ?? user.id ?? user.userId;
  return typeof id === "string" ? id : null;
}

/** Event details available to every platform's message template. */
interface ShareContext {
  title: string;
  date?: string;
  location?: string;
}

// Small helpers so templates read cleanly and degrade gracefully when an event
// is missing a date or location.
const onDate = (d?: string) => (d ? ` on ${d}` : "");
const inLocation = (l?: string) => (l ? ` in ${l}` : "");
const atLocation = (l?: string) => (l ? ` at ${l}` : "");
const whenWhere = (c: ShareContext) => {
  const parts = [c.date, c.location].filter(Boolean);
  return parts.length ? ` (${parts.join(", ")})` : "";
};

interface SharePlatform {
  key: string;
  label: string;
  /** Tailwind color classes for the icon button accent on hover. */
  hover: string;
  icon: React.ReactNode;
  /** The full, ready-to-paste message for this platform (link inline). */
  message: (ctx: ShareContext, link: string) => string;
  /** Build the platform share URL. Omitted for copy-only platforms (Discord). */
  href?: (ctx: ShareContext, link: string) => string;
  /** Platforms without a share URL (e.g. Discord) copy the message instead. */
  copy?: boolean;
}

const WhatsAppIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const TelegramIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const XIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const RedditIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z" />
  </svg>
);

const DiscordIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.74 19.74 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.3 12.3 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

// Platform-specific copy. Each returns the full message with the referral link
// placed where that platform reads best.
const MESSAGES = {
  whatsapp: (c: ShareContext, link: string) =>
    `Hey! 👋 I'm going to ${c.title}${onDate(c.date)}${inLocation(
      c.location
    )}. Come join me! ${link}`,
  telegram: (c: ShareContext, link: string) =>
    `Going to ${c.title}${whenWhere(c)}. Join me! ${link}`,
  x: (c: ShareContext, link: string) =>
    `Excited for ${c.title}${inLocation(
      c.location
    )}! 🚀 ${link} #Mainfranken #Tech`,
  linkedin: (c: ShareContext, link: string) =>
    `I'll be attending ${c.title}${onDate(c.date)}${atLocation(
      c.location
    )}. Great opportunity for networking and learning. Join me: ${link}`,
  reddit: (c: ShareContext, link: string) =>
    `Anyone going to ${c.title}${onDate(c.date)}? Here's the signup link: ${link}`,
  discord: (c: ShareContext, link: string) =>
    `yo check out ${c.title}${onDate(c.date)} — ${link}`,
} satisfies Record<string, (c: ShareContext, link: string) => string>;

const PLATFORMS: SharePlatform[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    hover: "hover:border-green-600 hover:text-green-600",
    icon: WhatsAppIcon,
    message: MESSAGES.whatsapp,
    href: (c, link) =>
      `https://wa.me/?text=${encodeURIComponent(MESSAGES.whatsapp(c, link))}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    hover: "hover:border-sky-500 hover:text-sky-500",
    icon: TelegramIcon,
    message: MESSAGES.telegram,
    // Telegram renders the url param as a link preview, so the text omits it.
    href: (c, link) =>
      `https://t.me/share/url?url=${encodeURIComponent(
        link
      )}&text=${encodeURIComponent(`Going to ${c.title}${whenWhere(c)}. Join me!`)}`,
  },
  {
    key: "x",
    label: "X",
    hover: "hover:border-foreground hover:text-foreground",
    icon: XIcon,
    message: MESSAGES.x,
    // Link is inline (before the hashtags), so don't also pass a url param.
    href: (c, link) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        MESSAGES.x(c, link)
      )}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    hover: "hover:border-blue-700 hover:text-blue-700",
    icon: LinkedInIcon,
    message: MESSAGES.linkedin,
    // LinkedIn's share-offsite endpoint only accepts a url — no prefilled text.
    href: (_c, link) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        link
      )}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    hover: "hover:border-orange-600 hover:text-orange-600",
    icon: RedditIcon,
    message: MESSAGES.reddit,
    // Reddit takes the link in `url` and the question as the post `title`.
    href: (c, link) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(
        link
      )}&title=${encodeURIComponent(
        `Anyone going to ${c.title}${onDate(c.date)}?`
      )}`,
  },
  {
    key: "discord",
    label: "Discord",
    hover: "hover:border-indigo-500 hover:text-indigo-500",
    icon: DiscordIcon,
    message: MESSAGES.discord,
    copy: true,
  },
];

export default function SharePanel({
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  reward = null,
}: {
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  reward?: EventReward | null;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  // Resolve the current user, then get-or-create their referral for this event.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) {
          if (!cancelled) setStatus("anonymous");
          return;
        }
        const uid = extractUserId(await meRes.json());
        if (!uid) {
          if (!cancelled) setStatus("anonymous");
          return;
        }

        const refRes = await fetch(
          `/api/referral?eventId=${encodeURIComponent(
            eventId
          )}&userId=${encodeURIComponent(uid)}`,
          { cache: "no-store" }
        );
        if (!refRes.ok) {
          if (!cancelled) setStatus("error");
          return;
        }
        const referral = await refRes.json();
        if (cancelled) return;

        if (typeof referral?.code === "string") {
          setCode(referral.code);
          setStatus("ready");
        } else {
          setStatus("error");
          return;
        }

        // If a reward exists, load the user's progress toward it.
        if (reward) {
          try {
            const ptsRes = await fetch(
              `/api/points?eventId=${encodeURIComponent(
                eventId
              )}&userId=${encodeURIComponent(uid)}`,
              { cache: "no-store" }
            );
            if (ptsRes.ok && !cancelled) {
              const pts = await ptsRes.json();
              const count =
                reward.mode === "checkin"
                  ? pts?.checkinCount
                  : pts?.signupCount;
              setReferralCount(typeof count === "number" ? count : 0);
            }
          } catch {
            // Non-fatal — the progress bar simply won't render.
          }
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, reward]);

  const referralLink = useMemo(() => {
    if (!code) return "";
    const base = origin || "";
    return `${base}/events/${eventId}?ref=${code}`;
  }, [origin, eventId, code]);

  const shareContext: ShareContext = {
    title: eventTitle,
    date: eventDate,
    location: eventLocation,
  };

  // Generic, platform-neutral invite used by the "Copy link" section.
  const datePart = eventDate ? ` on ${eventDate}` : "";
  const locationPart = eventLocation ? ` at ${eventLocation}` : "";
  const genericMessage = `I'm attending ${eventTitle}${datePart}${locationPart}. Would love to see you there! Register here:`;

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(`${genericMessage} ${referralLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — leave the input for manual copy.
    }
  }

  async function handleDiscordCopy(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setToast("Message copied! Paste it in Discord");
    } catch {
      setToast("Couldn't copy — copy your link below instead");
    }
    setTimeout(() => setToast(null), 3000);
  }

  function awardSharePoints(platform: string) {
    // Fire-and-forget; the server dedupes per platform.
    fetch("/api/referral/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, platform }),
    }).catch(() => {});
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <span className="inline-block h-5 w-1.5 rounded-full bg-primary" />
          Share &amp; earn points
        </CardTitle>
        <CardDescription>
          Invite friends with your personal link. You earn points when they
          register and check in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reward && referralCount !== null && (
          <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-baseline justify-between gap-2 text-sm font-semibold text-foreground">
              <span>
                {Math.min(referralCount, reward.threshold)}/{reward.threshold}{" "}
                referral{reward.threshold === 1 ? "" : "s"}
              </span>
              <span className="text-foreground/70">
                {referralCount >= reward.threshold
                  ? `Earned ${reward.rewardLabel} 🎉`
                  : `earn a ${reward.rewardLabel}`}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={Math.min(referralCount, reward.threshold)}
              aria-valuemin={0}
              aria-valuemax={reward.threshold}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (referralCount / reward.threshold) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {status === "loading" && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Loading your referral link…
          </p>
        )}

        {status === "anonymous" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Log in to get your referral link.
            </p>
            <Button asChild>
              <Link href="/auth">Log in</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            We couldn&rsquo;t load your referral link. Please try again later.
          </p>
        )}

        {status === "ready" && (
          <div className="flex flex-col gap-6">
            {/* Primary action: share to a platform */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORMS.map((p) => {
                const trackedLink = `${referralLink}&platform=${p.key}`;
                const className = cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary",
                  p.hover
                );
                const inner = (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground/70">
                      {p.icon}
                    </span>
                    {p.label}
                  </>
                );

                if (p.copy) {
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        awardSharePoints(p.key);
                        void handleDiscordCopy(p.message(shareContext, trackedLink));
                      }}
                      aria-label={`Copy message for ${p.label}`}
                      title={`Copy message for ${p.label}`}
                      className={className}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <a
                    key={p.key}
                    href={p.href!(shareContext, trackedLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => awardSharePoints(p.key)}
                    aria-label={`Share on ${p.label}`}
                    title={`Share on ${p.label}`}
                    className={className}
                  >
                    {inner}
                  </a>
                );
              })}
            </div>

            {toast && (
              <p
                role="status"
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-foreground"
              >
                {toast}
              </p>
            )}

            {/* Secondary action: copy the raw link */}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground/70">
                Or copy a ready-to-share invite
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={referralLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Your referral link"
                />
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" /> Copy link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
