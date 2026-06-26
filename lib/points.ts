import { pointsLedger, referrals } from "@/lib/collections";
import type { PointsEntry } from "@/lib/types";

export type Reason = PointsEntry["reason"];

/** Aggregated view of a user's points ledger. */
export interface PointsSummary {
  totalPoints: number;
  /** Sum of points awarded per reason. */
  pointsByReason: Record<Reason, number>;
  /** Number of awards per reason (one award == one referred action). */
  countByReason: Record<Reason, number>;
  eventCount: number;
  referralCount: number;
  /** People this user drove to register for events (referred sign-ups). */
  peopleBrought: number;
}

/** Tier thresholds, ordered ascending by the points required to enter. */
export const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 50 },
  { name: "Gold", min: 150 },
  { name: "Diamond", min: 500 },
] as const;

export type TierName = (typeof TIERS)[number]["name"];

export interface TierProgress {
  tier: TierName;
  tierIndex: number;
  nextTier: TierName | null;
  /** Points accumulated within the current tier band. */
  pointsIntoTier: number;
  /** Points still needed to reach the next tier (null at top tier). */
  pointsToNext: number | null;
  /** 0..100 progress toward the next tier. */
  progressPct: number;
}

export function computeTier(points: number): TierProgress {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (points >= TIERS[i].min) idx = i;
  }
  const current = TIERS[idx];
  const next = TIERS[idx + 1] ?? null;
  const pointsIntoTier = points - current.min;

  if (!next) {
    return {
      tier: current.name,
      tierIndex: idx,
      nextTier: null,
      pointsIntoTier,
      pointsToNext: null,
      progressPct: 100,
    };
  }

  const span = next.min - current.min;
  const progressPct = Math.max(0, Math.min(100, (pointsIntoTier / span) * 100));
  return {
    tier: current.name,
    tierIndex: idx,
    nextTier: next.name,
    pointsIntoTier,
    pointsToNext: next.min - points,
    progressPct,
  };
}

export interface BadgeDef {
  key: string;
  label: string;
  description: string;
  earned: boolean;
  /** Progress toward earning, for badges with a count threshold. */
  progress?: { current: number; target: number };
}

export function computeBadges(s: PointsSummary): BadgeDef[] {
  return [
    {
      key: "first-share",
      label: "First Share",
      description: "Shared your first event",
      earned: s.countByReason.share >= 1,
    },
    {
      key: "connector",
      label: "Connector",
      description: "Drove 5 referral sign-ups",
      earned: s.countByReason.signup >= 5,
      progress: { current: s.countByReason.signup, target: 5 },
    },
    {
      key: "crowd-puller",
      label: "Crowd Puller",
      description: "Your first referred check-in",
      earned: s.countByReason.checkin >= 1,
    },
    {
      key: "community-champion",
      label: "Community Champion",
      description: "Drove 10 referred check-ins",
      earned: s.countByReason.checkin >= 10,
      progress: { current: s.countByReason.checkin, target: 10 },
    },
  ];
}

/** Fold a raw ledger into a summary. Pure — safe to share across server + API. */
export function summarize(
  entries: PointsEntry[],
  referralCount: number
): PointsSummary {
  const pointsByReason: Record<Reason, number> = {
    share: 0,
    signup: 0,
    checkin: 0,
  };
  const countByReason: Record<Reason, number> = {
    share: 0,
    signup: 0,
    checkin: 0,
  };
  const eventSet = new Set<string>();
  let totalPoints = 0;

  for (const e of entries) {
    totalPoints += e.points;
    pointsByReason[e.reason] += e.points;
    countByReason[e.reason] += 1;
    eventSet.add(e.eventId);
  }

  return {
    totalPoints,
    pointsByReason,
    countByReason,
    eventCount: eventSet.size,
    referralCount,
    peopleBrought: countByReason.signup,
  };
}

/** Load + aggregate a user's points ledger straight from the database. */
export async function getPointsSummary(userId: string): Promise<PointsSummary> {
  const ledgerCol = await pointsLedger();
  const [entries, referralCount] = await Promise.all([
    ledgerCol.find({ userId }).toArray() as Promise<PointsEntry[]>,
    (await referrals()).countDocuments({ referrerId: userId }),
  ]);
  return summarize(entries, referralCount);
}
