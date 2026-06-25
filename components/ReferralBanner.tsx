"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Gift } from "lucide-react";

/**
 * "[Name] invited you to this event" banner.
 *
 * Reads the ?ref= code from the URL and resolves it to the referrer's name.
 * Renders nothing when there's no ref param or the code can't be resolved.
 * Works for both logged-in and anonymous visitors (the lookup is public).
 *
 * Carries its own bottom margin so it leaves no gap when it renders nothing.
 */
export default function ReferralBanner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setName(null);
      return;
    }

    let cancelled = false;
    fetch(`/api/referral/lookup?code=${encodeURIComponent(ref)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.name === "string") {
          setName(data.name);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [ref]);

  if (!ref || !name) return null;

  return (
    <div
      role="status"
      className="mb-8 flex items-center gap-4 rounded-2xl border-2 border-primary bg-primary/15 px-5 py-4"
    >
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <Gift className="h-5 w-5" />
      </span>
      <p className="text-sm text-foreground sm:text-base">
        <span className="font-bold">{name}</span> invited you to this event
        <span aria-hidden="true"> 🎉</span>
      </p>
    </div>
  );
}
