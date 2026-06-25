import { cookies } from "next/headers";
import { events, registrations, profiles } from "@/lib/collections";
import EventsGrid, {
  type SerializedEvent,
  type EventSocial,
} from "@/components/EventsGrid";
import ActivityTicker from "@/components/ActivityTicker";

// Events come from MongoDB at request time — never statically prerender.
export const dynamic = "force-dynamic";

function toISO(value?: Date | string) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

async function getEvents(): Promise<SerializedEvent[]> {
  const col = await events();
  const docs = await col.find({}).sort({ startsAt: 1 }).toArray();

  return docs.map((doc) => ({
    _id: String(doc._id),
    title: doc.title,
    description: doc.description,
    startsAt: toISO(doc.startsAt),
    location: doc.location,
    imageUrl: doc.imageUrl,
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
          IT-Events in der Region
        </h1>
        <p className="mt-3 text-muted-foreground">
          Discover meetups, workshops, and gatherings across the Mainfranken
          tech community. We look forward to seeing you there.
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
