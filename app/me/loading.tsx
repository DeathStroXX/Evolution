// Loading skeleton for the /me points page. Rendered inside the me layout's
// max-w-4xl container, so it only mirrors the inner content: header, tier
// card, achievements grid, and per-event cards.
function CardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow">
      {children}
    </div>
  );
}

export default function MeLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-80 max-w-full rounded bg-muted" />
      </div>

      {/* Tier card */}
      <CardSkeleton>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-6 w-24 rounded bg-muted" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-8 w-16 rounded bg-muted" />
            <div className="ml-auto h-3 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="mt-5 h-2.5 w-full rounded-full bg-muted" />
      </CardSkeleton>

      {/* Achievements */}
      <CardSkeleton>
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="h-4 w-44 rounded bg-muted" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-lg border border-border p-4"
            >
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </CardSkeleton>

      {/* Per-event cards */}
      <div className="flex flex-col gap-4">
        <div className="h-5 w-24 rounded bg-muted" />
        {Array.from({ length: 2 }).map((_, i) => (
          <CardSkeleton key={i}>
            <div className="space-y-2">
              <div className="h-5 w-1/2 rounded bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
            </div>
            <div className="mt-4 h-2.5 w-full rounded-full bg-muted" />
          </CardSkeleton>
        ))}
      </div>
    </div>
  );
}
