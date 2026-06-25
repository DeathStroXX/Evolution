import { events } from "@/lib/collections";
import EventsGrid, { type SerializedEvent } from "@/components/EventsGrid";

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

export default async function EventsPage() {
  const allEvents = await getEvents();

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

      {allEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-lg font-semibold">No events yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon — new community events are added regularly.
          </p>
        </div>
      ) : (
        <EventsGrid events={allEvents} />
      )}
    </div>
  );
}
