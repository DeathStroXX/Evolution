// Loading skeleton for the organizer dashboard. Rendered inside the dashboard
// layout's max-w-5xl container, so it mirrors the inner content: header row,
// stat cards, and the events table card.
function CardSkeleton({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-card shadow ${className}`}
    >
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-muted" />
          <div className="h-4 w-64 max-w-full rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} className="p-6">
            <div className="h-1.5 w-8 rounded-full bg-muted" />
            <div className="mt-3 h-3 w-20 rounded bg-muted" />
            <div className="mt-2 h-8 w-12 rounded bg-muted" />
          </CardSkeleton>
        ))}
      </div>

      {/* Events table */}
      <CardSkeleton>
        <div className="p-6">
          <div className="h-5 w-28 rounded bg-muted" />
        </div>
        <div className="space-y-4 px-6 pb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-4 w-10 rounded bg-muted" />
              <div className="h-4 w-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </CardSkeleton>
    </div>
  );
}
