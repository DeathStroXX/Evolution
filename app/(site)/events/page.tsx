import { cookies } from "next/headers";
import { events, registrations, profiles } from "@/lib/collections";
import { T } from "@/lib/i18n";
import EventsGrid, {
  type SerializedEvent,
  type EventSocial,
} from "@/components/EventsGrid";
import ActivityTicker from "@/components/ActivityTicker";

// Events come from MongoDB at request time — never statically prerender.
export const dynamic = "force-dynamic";

// Tags that signal an event is relevant to our IT/tech audience. Used to rank
// and cap external-source events so the catalog stays on-topic.
const TECH_TAGS = new Set([
  "ai",
  "machine learning",
  "it",
  "tech",
  "software",
  "engineering",
  "developer",
  "devops",
  "cloud",
  "data",
  "design",
  "startup",
  "startups",
  "hackathon",
  "career",
  "networking",
  "product",
  "cyber",
  "robotics",
]);

// Cap on how many external-source events appear in the catalog at once.
const MAX_EXTERNAL_EVENTS = 6;

// Flagship event pinned to the top of the catalog, ahead of date ordering.
const PINNED_EVENT_TITLE = "AI Week Mainfranken 2026";

function toISO(value?: Date | string) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function startTime(value?: Date | string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? Number.POSITIVE_INFINITY : d.getTime();
}

// How many tech-relevant tags an event carries. Higher = more on-topic.
function techScore(tags?: string[]) {
  return (tags ?? []).filter((t) => TECH_TAGS.has(t.toLowerCase())).length;
}

async function getEvents(): Promise<SerializedEvent[]> {
  const col = await events();
  // Only show upcoming events — hide anything whose start date is in the past.
  // startsAt is stored as a Date (see lib/types.ts), so a direct $gte comparison
  // against `now` works.
  const docs = await col.find({ startsAt: { $gte: new Date() } }).toArray();

  // External-source events (those that link out) are de-cluttered: keep only
  // the tech-relevant ones, capped at MAX_EXTERNAL_EVENTS. Clearly off-topic
  // ones (children's events, museum tours, food, etc.) carry no tech tags and
  // are dropped here. Internal/seeded events are always kept.
  const internal = docs.filter((d) => !d.sourceUrl);
  const external = docs
    .filter((d) => d.sourceUrl && techScore(d.tags) > 0)
    .sort(
      (a, b) =>
        techScore(b.tags) - techScore(a.tags) ||
        startTime(a.startsAt) - startTime(b.startsAt)
    )
    .slice(0, MAX_EXTERNAL_EVENTS);

  // AI Week is our flagship event — pin it to the top. Everything else, seeded
  // and external alike, is mixed together and ordered soonest-first so the
  // catalog reads as one organic timeline rather than grouped buckets.
  const ordered = [...internal, ...external].sort((a, b) => {
    const aPinned = a.title === PINNED_EVENT_TITLE;
    const bPinned = b.title === PINNED_EVENT_TITLE;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return startTime(a.startsAt) - startTime(b.startsAt);
  });

  return ordered.map((doc) => ({
    _id: String(doc._id),
    title: doc.title,
    description: doc.description,
    startsAt: toISO(doc.startsAt),
    location: doc.location,
    imageUrl: doc.imageUrl,
    sourceUrl: doc.sourceUrl,
    coverImage: doc.coverImage,
    tags: doc.tags ?? [],
  }));
}

// Build a per-event "who's going" summary: total count + a few registrant names.
async function getSocialProof(): Promise<Record<string, EventSocial>> {
  const regCol = await registrations();
  const regs = await regCol
    .find({}, { projection: { eventId: 1, userId: 1 } })
    .toArray();

  if (regs.length === 0) return {};

  // Resolve registrant display names in one batch.
  const userIds = Array.from(
    new Set(regs.map((r) => r.userId).filter(Boolean))
  );
  const profileCol = await profiles();
  const profileDocs = await profileCol
    .find({ _id: { $in: userIds } }, { projection: { name: 1 } })
    .toArray();
  const nameById = new Map(
    profileDocs.map((p) => [String(p._id), p.name?.trim() || ""])
  );

  const social: Record<string, EventSocial> = {};
  for (const reg of regs) {
    const entry = (social[reg.eventId] ??= { count: 0, names: [] });
    entry.count += 1;
    if (entry.names.length < 3) {
      const name = nameById.get(reg.userId);
      if (name) entry.names.push(name);
    }
  }

  return social;
}

// Which events the logged-in user has already registered for.
async function getRegisteredEventIds(): Promise<string[]> {
  const userId = cookies().get("session")?.value;
  if (!userId) return [];

  const regCol = await registrations();
  const regs = await regCol
    .find({ userId }, { projection: { eventId: 1 } })
    .toArray();
  return regs.map((r) => r.eventId);
}

export default async function EventsPage() {
  const [allEvents, social, registeredEventIds] = await Promise.all([
    getEvents(),
    getSocialProof(),
    getRegisteredEventIds(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <span className="inline-block h-1.5 w-12 rounded-full bg-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          <T k="events.title" />
        </h1>
        <p className="mt-3 text-muted-foreground">
          <T k="events.subtitle" />
        </p>
      </header>

      <ActivityTicker />

      {allEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-semibold">No events yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon — new community events are added regularly.
          </p>
        </div>
      ) : (
        <EventsGrid
          events={allEvents}
          social={social}
          registeredEventIds={registeredEventIds}
        />
      )}
    </div>
  );
}
