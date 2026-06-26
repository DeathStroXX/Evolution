"use client";

import { useEffect, useState } from "react";

/**
 * Reusable lightweight confetti burst — CSS only, no npm package.
 *
 * Mount <Confetti /> once (e.g. in the root layout), then call showConfetti()
 * when a reward threshold is crossed. Each call spawns a short-lived burst of
 * colored pieces that fan out from the top-center and fall away.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let burstCounter = 0;

/** Trigger a confetti burst. Safe to call with no <Confetti/> mounted. */
export function showConfetti() {
  listeners.forEach((listener) => listener());
}

interface Piece {
  id: string;
  left: number; // vw
  dx: number; // px horizontal drift
  dy: number; // px fall distance
  rot: number; // deg
  dur: number; // s
  delay: number; // s
  size: number; // px
  color: string;
}

// Brand lime first, then a festive spread.
const COLORS = [
  "hsl(67 100% 43%)",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#10b981",
  "#8b5cf6",
];

const PIECES_PER_BURST = 70;
const MAX_LIFETIME_MS = 2200;

function makeBurst(): Piece[] {
  const burstId = burstCounter++;
  return Array.from({ length: PIECES_PER_BURST }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 60 + Math.random() * 220;
    return {
      id: `${burstId}-${i}`,
      left: 50 + (Math.random() * 30 - 15),
      dx: Math.cos(angle) * radius,
      // Bias downward so pieces fall like real confetti.
      dy: Math.abs(Math.sin(angle)) * radius + 180 + Math.random() * 160,
      rot: Math.random() * 720 - 360,
      dur: 0.9 + Math.random() * 0.8,
      delay: Math.random() * 0.15,
      size: 6 + Math.random() * 7,
      color: COLORS[i % COLORS.length],
    };
  });
}

export function Confetti() {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const listener: Listener = () => {
      const burst = makeBurst();
      setPieces((prev) => [...prev, ...burst]);
      const ids = new Set(burst.map((p) => p.id));
      window.setTimeout(() => {
        setPieces((prev) => prev.filter((p) => !ids.has(p.id)));
      }, MAX_LIFETIME_MS);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (pieces.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[110] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-burst absolute top-[18%] rounded-[2px]"
          style={{
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
            ["--dur" as string]: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
