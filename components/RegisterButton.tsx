"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

type Status =
  | "loading"
  | "anonymous"
  | "register"
  | "registered"
  | "error";

interface RegistrationLike {
  _id: string;
}

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

export default function RegisterButton({
  eventId,
  eventTitle,
  reward = null,
}: {
  eventId: string;
  eventTitle: string;
  reward?: EventReward | null;
}) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;

  const [status, setStatus] = useState<Status>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [registration, setRegistration] = useState<RegistrationLike | null>(
    null
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine auth + registration status on mount.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) {
          if (!cancelled) setStatus("anonymous");
          return;
        }
        const me = await meRes.json();
        const uid = extractUserId(me);
        if (!uid) {
          if (!cancelled) setStatus("anonymous");
          return;
        }
        if (cancelled) return;
        setUserId(uid);

        const checkRes = await fetch(
          `/api/registrations/check?eventId=${encodeURIComponent(
            eventId
          )}&userId=${encodeURIComponent(uid)}`,
          { cache: "no-store" }
        );
        const check = await checkRes.json();
        if (cancelled) return;

        if (check?.registered && check.registration) {
          setRegistration(check.registration);
          setStatus("registered");
        } else {
          setStatus("register");
        }
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // Generate the QR code whenever we have a confirmed registration.
  useEffect(() => {
    if (!registration?._id) return;
    let cancelled = false;
    QRCode.toDataURL(registration._id, { width: 220, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [registration]);

  const handleRegister = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, referralCode: ref }),
      });

      if (res.status === 409) {
        // Already registered — recover the existing registration.
        if (userId) {
          const checkRes = await fetch(
            `/api/registrations/check?eventId=${encodeURIComponent(
              eventId
            )}&userId=${encodeURIComponent(userId)}`,
            { cache: "no-store" }
          );
          const check = await checkRes.json();
          if (check?.registered && check.registration) {
            setRegistration(check.registration);
            setStatus("registered");
            return;
          }
        }
        setError("You're already registered for this event.");
        return;
      }

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const created = await res.json();
      setRegistration(created);
      setStatus("registered");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [eventId, ref, userId]);

  if (status === "loading") {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Checking your registration…
      </p>
    );
  }

  if (status === "anonymous") {
    // Send the user back to this event after auth — preserving the referral
    // code so the referrer gets credited when they register.
    const returnTo = `/events/${eventId}${ref ? `?ref=${ref}` : ""}`;
    const authHref = `/auth?redirect=${encodeURIComponent(returnTo)}`;
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Sign in to reserve your spot for{" "}
          <span className="font-medium text-foreground">{eventTitle}</span>.
        </p>
        <Button asChild size="lg">
          <Link href={authHref}>Join to Register</Link>
        </Button>
      </div>
    );
  }

  if (status === "registered") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-lg font-semibold text-foreground">
              You&rsquo;re registered
            </span>
          </div>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Your registration QR code"
                className="h-40 w-40 rounded-lg border border-border bg-white p-2"
              />
              <p className="text-xs text-muted-foreground">
                Show this QR code at check-in
              </p>
            </div>
          )}
        </div>

        {/* Post-registration: push sharing as the dominant next action. */}
        {reward && (
          <Button
            asChild
            size="lg"
            className="h-12 w-full text-base font-semibold"
          >
            <a href="#share">
              Share with friends to earn {reward.rewardLabel}
            </a>
          </Button>
        )}
      </div>
    );
  }

  // status === "register" (or "error" fallback)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Reserve your spot for{" "}
          <span className="font-medium text-foreground">{eventTitle}</span>.
        </p>
        <Button
          size="lg"
          onClick={handleRegister}
          disabled={submitting}
        >
          {submitting ? "Registering…" : "Register"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
