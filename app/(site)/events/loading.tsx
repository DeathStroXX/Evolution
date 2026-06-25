// Loading skeleton for the events catalog. Mirrors the real page layout:
// header block, filter pills, and a responsive grid of event cards.
const FILTER_WIDTHS = ["w-12", "w-10", "w-8", "w-16", "w-14", "w-20"];

function EventCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Cover */}
      <div className="aspect-[16/9] w-full bg-muted" />
      {/* Body */}
      <div className="space-y-3 p-6">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-14 rounded-full bg-muted" />
          <div className="h-5 w-12 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 max-w-2xl animate-pulse">
        <div className="h-1.5 w-12 rounded-full bg-muted" />
        <div className="mt-4 h-9 w-2/3 rounded bg-muted" />
        <div className="mt-4 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-5/6 rounded bg-muted" />
      </div>

      {/* Filter pills */}
      <div className="mb-8 flex animate-pulse flex-wrap gap-2">
        {FILTER_WIDTHS.map((w, i) => (
          <div
            key={i}
            className={`h-8 ${w} rounded-full bg-muted`}
            style={{ minWidth: "3.5rem" }}
          />
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
