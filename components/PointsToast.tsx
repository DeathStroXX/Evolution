"use client";

import { useEffect, useState } from "react";

/**
 * Reusable floating "+N pts" toast.
 *
 * Mount <PointsToast /> once (e.g. in the root layout), then call
 * showPointsToast(points) from anywhere to pop a celebratory animation in the
 * bottom-right corner. Pure CSS animation — no libraries.
 */

type Listener = (points: number) => void;

const listeners = new Set<Listener>();
let counter = 0;

/** Fire a "+N pts" toast. Safe to call even if no <PointsToast/> is mounted. */
export function showPointsToast(points: number) {
  if (!Number.isFinite(points) || points === 0) return;
  Array.from(listeners).forEach((listener) => listener(points));
}

interface ActiveToast {
  id: number;
  points: number;
}

const VISIBLE_MS = 1700; // keep in sync with .animate-points-toast duration

export function PointsToast() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const listener: Listener = (points) => {
      const id = counter++;
      setToasts((prev) => [...prev, { id, points }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, VISIBLE_MS);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col-reverse items-end gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-points-toast flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg"
        >
          <span aria-hidden="true">+{t.points}</span>
          <span className="font-semibold">pts</span>
        </div>
      ))}
    </div>
  );
}

export default PointsToast;
