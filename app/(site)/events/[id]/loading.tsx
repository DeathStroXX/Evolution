// Loading skeleton for the event detail page. Mirrors the real layout:
// cover image, tags + title, the when/where grid, description, and the
// registration card.
export default function EventDetailLoading() {
  return (
    <article className="mx-auto max-w-4xl animate-pulse px-4 py-12 sm:px-6 lg:px-8">
      {/* Cover */}
      <div className="aspect-[16/9] w-full rounded-2xl bg-muted" />

      {/* Header */}
      <div className="mt-8">
        <div className="mb-4 flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted" />
          <div className="h-5 w-14 rounded-full bg-muted" />
        </div>
        <div className="h-9 w-3/4 rounded bg-muted" />
        <div className="mt-4 h-9 w-56 rounded-full bg-muted" />

        {/* When / where */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="h-4 w-40 rounded bg-muted" />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>

      {/* Registration card */}
      <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-11 w-32 rounded-md bg-muted" />
        </div>
      </div>
    </article>
  );
}
