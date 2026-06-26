import type { PointsEntry } from "@/lib/types";

/** Share platforms we track, in display order. Shared across dashboard views. */
export const PLATFORMS: { key: string; label: string }[] = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "telegram", label: "Telegram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X" },
  { key: "reddit", label: "Reddit" },
  { key: "discord", label: "Discord" },
];

export const PLATFORM_LABEL = new Map(PLATFORMS.map((p) => [p.key, p.label]));

/** Brand-ish accent per platform, used for the breakdown bars. */
export const PLATFORM_COLOR: Record<string, string> = {
  whatsapp: "#25D366",
  telegram: "#229ED9",
  linkedin: "#0A66C2",
  x: "#0f0f0f",
  reddit: "#FF4500",
  discord: "#5865F2",
};

export interface PlatformDatum {
  key: string;
  label: string;
  count: number;
}

/** Extract the trailing platform segment from `share:user:event:platform`. */
export function platformFromDedupeKey(dedupeKey: string): string | null {
  if (!dedupeKey.startsWith("share:")) return null;
  const parts = dedupeKey.split(":");
  return parts.length >= 4 ? parts[parts.length - 1] : null;
}

/**
 * Resolve a share ledger entry's platform key. Newer docs carry a `platform`
 * field; older ones encode it in the dedupeKey. Returns null when the platform
 * isn't one we track.
 */
export function platformOf(entry: PointsEntry): string | null {
  const platform = entry.platform ?? platformFromDedupeKey(entry.dedupeKey);
  return platform && PLATFORM_LABEL.has(platform) ? platform : null;
}

/**
 * Tally share entries into a per-platform breakdown, sorted high→low and
 * dropping zero-count platforms. When there are no real shares, falls back to a
 * deterministic sample distribution so the dashboard still tells a story.
 * `mockDistribution` is matched positionally to PLATFORMS.
 */
export function buildPlatformBreakdown(
  shareEntries: PointsEntry[],
  mockDistribution: number[]
): { breakdown: PlatformDatum[]; totalShares: number; isMock: boolean } {
  const counts = new Map<string, number>();
  for (const entry of shareEntries) {
    const key = platformOf(entry);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const real = counts.size > 0;
  const breakdown: PlatformDatum[] = PLATFORMS.map((p, i) => ({
    key: p.key,
    label: p.label,
    count: real ? counts.get(p.key) ?? 0 : mockDistribution[i] ?? 0,
  }))
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalShares = breakdown.reduce((sum, p) => sum + p.count, 0);
  return { breakdown, totalShares, isMock: !real };
}
