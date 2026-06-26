import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLATFORM_COLOR, type PlatformDatum } from "@/lib/shareStats";

/**
 * Horizontal bar chart of share counts per platform — same visual language as
 * the per-event platform breakdown, but reusable across dashboard views.
 * Pure/presentational, so it renders fine in a server component.
 */
export function SharePlatformChart({
  title,
  description,
  platform,
  isMock,
}: {
  title: string;
  description?: string;
  platform: PlatformDatum[];
  isMock?: boolean;
}) {
  const maxCount = Math.max(1, ...platform.map((p) => p.count));
  const totalShares = platform.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description !== undefined && (
          <CardDescription>
            {description}
            {isMock ? " (sample data)" : ""}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {totalShares === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
            No shares recorded yet
          </div>
        ) : (
          <ul className="space-y-3">
            {platform.map((p) => {
              const pct = totalShares
                ? Math.round((p.count / totalShares) * 100)
                : 0;
              return (
                <li key={p.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {p.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.count} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, (p.count / maxCount) * 100)}%`,
                        backgroundColor:
                          PLATFORM_COLOR[p.key] ?? "var(--primary)",
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
