import { NextResponse } from "next/server";
import { pointsLedger, profiles, events } from "@/lib/collections";
import type { PointsEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

// The ledger records activity from the REFERRER's perspective, so the userName
// is always the referrer. Phrases are the connector between the name and the
// event title (the checkin phrase is possessive and attaches to the name).
const ACTION_LABELS: Record<PointsEntry["reason"], string> = {
  signup: "got a friend to sign up for",
  share: "shared",
  checkin: "'s referral checked in at",
};

export interface ActivityItem {
  userName: string;
  action: string;
  eventTitle: string;
  /** ISO timestamp — the client renders a relative label. */
  timestamp: string;
}

/**
 * GET /api/activity
 * Returns the most recent referral/registration activity for the live ticker:
 * the latest points-ledger entries, joined with profiles (names) and events
 * (titles). Entries without a resolvable event title are skipped.
 */
export async function GET() {
  const ledger = await pointsLedger();
  const recent = (await ledger
    .find({})
    .sort({ createdAt: -1 })
    .limit(15)
    .toArray()) as PointsEntry[];

  if (recent.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Resolve names + titles in two batched lookups.
  const userIds = Array.from(new Set(recent.map((e) => e.userId).filter(Boolean)));
  const eventIds = Array.from(
    new Set(recent.map((e) => e.eventId).filter(Boolean))
  );

  const [profileDocs, eventDocs] = await Promise.all([
    (await profiles())
      .find({ _id: { $in: userIds } }, { projection: { name: 1 } })
      .toArray(),
    (await events())
      .find({ _id: { $in: eventIds } }, { projection: { title: 1 } })
      .toArray(),
  ]);

  const nameById = new Map(
    profileDocs.map((p) => [String(p._id), p.name?.trim() || ""])
  );
  const titleById = new Map(
    eventDocs.map((e) => [String(e._id), e.title?.trim() || ""])
  );

  const items: ActivityItem[] = [];
  for (const entry of recent) {
    const eventTitle = titleById.get(entry.eventId);
    if (!eventTitle) continue; // Can't show an activity without an event.

    items.push({
      userName: nameById.get(entry.userId) || "Someone",
      action: ACTION_LABELS[entry.reason],
      eventTitle,
      timestamp:
        entry.createdAt instanceof Date
          ? entry.createdAt.toISOString()
          : new Date(entry.createdAt).toISOString(),
    });
  }

  return NextResponse.json({ items });
}
