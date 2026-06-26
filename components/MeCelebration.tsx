"use client";

import { useEffect } from "react";
import { showConfetti } from "@/components/Confetti";

/**
 * Fires a one-time confetti burst when the user lands on /me having reached a
 * reward tier above Bronze. Guarded per-tier via sessionStorage so it only
 * celebrates each newly-crossed threshold once per session.
 */
export default function MeCelebration({
  tier,
  tierIndex,
}: {
  tier: string;
  tierIndex: number;
}) {
  useEffect(() => {
    if (tierIndex <= 0) return; // Bronze / no points — nothing to celebrate.

    const key = `me-celebrated:${tier}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable (private mode) — celebrate anyway.
    }

    const id = window.setTimeout(() => showConfetti(), 350);
    return () => window.clearTimeout(id);
  }, [tier, tierIndex]);

  return null;
}
