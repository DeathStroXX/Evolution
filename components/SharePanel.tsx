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

const SHARE_MESSAGE = "Check out this event!";

function extractUserId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const user = (d.user as Record<string, unknown>) ?? d;
  const id = user._id ?? user.id ?? user.userId;
  return typeof id === "string" ? id : null;
}

interface SharePlatform {
  key: string;
  label: string;
  /** Tailwind color classes for the icon button accent on hover. */
  hover: string;
  icon: React.ReactNode;
  /** Build the platform share URL given the prefilled message + referral link. */
  href: (message: string, link: string) => string;
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

const PLATFORMS: SharePlatform[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    hover: "hover:border-green-600 hover:text-green-600",
    icon: WhatsAppIcon,
    href: (message, link) =>
      `https://wa.me/?text=${encodeURIComponent(`${message} ${link}`)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    hover: "hover:border-sky-500 hover:text-sky-500",
    icon: TelegramIcon,
    href: (message, link) =>
      `https://t.me/share/url?url=${encodeURIComponent(
        link
      )}&text=${encodeURIComponent(message)}`,
  },
  {
    key: "x",
    label: "X",
    hover: "hover:border-foreground hover:text-foreground",
    icon: XIcon,
    href: (message, link) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        message
      )}&url=${encodeURIComponent(link)}`,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    hover: "hover:border-blue-700 hover:text-blue-700",
    icon: LinkedInIcon,
    href: (message, link) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        link
      )}`,
  },
];

export default function SharePanel({ eventId }: { eventId: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

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
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const referralLink = useMemo(() => {
    if (!code) return "";
    const base = origin || "";
    return `${base}/events/${eventId}?ref=${code}`;
  }, [origin, eventId, code]);

  async function handleCopy() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — leave the input for manual copy.
    }
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
          <div className="flex flex-col gap-4">
            {/* Copyable link */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={referralLink}
                onFocus={(e) => e.currentTarget.select()}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Your referral link"
              />
              <Button onClick={handleCopy} className="shrink-0">
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

            {/* Share buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {PLATFORMS.map((p) => {
                const trackedLink = `${referralLink}&platform=${p.key}`;
                return (
                  <a
                    key={p.key}
                    href={p.href(SHARE_MESSAGE, trackedLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => awardSharePoints(p.key)}
                    aria-label={`Share on ${p.label}`}
                    title={`Share on ${p.label}`}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
                      p.hover
                    )}
                  >
                    {p.icon}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
