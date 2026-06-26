"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export interface PlatformDatum {
  key: string;
  label: string;
  count: number;
}

export interface FunnelData {
  shares: number;
  registrations: number;
  checkins: number;
}

export interface AnalyticsRow {
  name: string;
  email: string;
  signups: number;
  checkins: number;
  platform: string;
}

/** Brand-ish accent per platform, used for the breakdown bars. */
const PLATFORM_COLOR: Record<string, string> = {
  whatsapp: "#25D366",
  telegram: "#229ED9",
  linkedin: "#0A66C2",
  x: "#0f0f0f",
  reddit: "#FF4500",
  discord: "#5865F2",
};

export function EventAnalytics({
  platform,
  funnel,
  rows,
  isMockPlatform,
  eventTitle,
}: {
  platform: PlatformDatum[];
  funnel: FunnelData;
  rows: AnalyticsRow[];
  isMockPlatform: boolean;
  eventTitle: string;
}) {
  const maxCount = Math.max(1, ...platform.map((p) => p.count));
  const totalShares = platform.reduce((sum, p) => sum + p.count, 0);

  function exportCsv() {
    const header = [
      "Referrer",
      "Email",
      "Signups driven",
      "Check-ins driven",
      "Top platform",
    ];
    const lines = [
      header.map(csvCell).join(","),
      ...rows.map((r) =>
        [r.name, r.email, r.signups, r.checkins, r.platform]
          .map(csvCell)
          .join(",")
      ),
    ];
    const csv = lines.join("\r\n");
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(eventTitle)}-referral-analytics.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Platform breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform breakdown</CardTitle>
          <CardDescription>
            Which channels your ambassadors share through
            {isMockPlatform ? " (sample data)" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalShares === 0 ? (
            <EmptyHint>No shares recorded yet</EmptyHint>
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
                        {p.count}{" "}
                        <span className="text-xs">({pct}%)</span>
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

      {/* Conversion funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion funnel</CardTitle>
          <CardDescription>
            From shares to seats filled to people in the room.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const max = Math.max(
              funnel.shares,
              funnel.registrations,
              funnel.checkins,
              1
            );
            return (
              <div className="space-y-3">
                <FunnelBar
                  label="Shares"
                  value={funnel.shares}
                  max={max}
                  color="bg-primary"
                />
                <ConversionLabel
                  from={funnel.shares}
                  to={funnel.registrations}
                  verb="registered"
                />
                <FunnelBar
                  label="Registrations"
                  value={funnel.registrations}
                  max={max}
                  color="bg-primary/70"
                />
                <ConversionLabel
                  from={funnel.registrations}
                  to={funnel.checkins}
                  verb="checked in"
                />
                <FunnelBar
                  label="Check-ins"
                  value={funnel.checkins}
                  max={max}
                  color="bg-primary/45"
                />
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* CSV export */}
      <Card className="lg:col-span-2">
        <CardContent className="flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-foreground">
              Export referral analytics
            </p>
            <p className="text-sm text-muted-foreground">
              Download the full ambassador table as a CSV
              {rows.length > 0 ? ` (${rows.length} referrers)` : ""}.
            </p>
          </div>
          <Button
            onClick={exportCsv}
            disabled={rows.length === 0}
            variant="outline"
            className="shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const width = max > 0 ? Math.max(6, (value / max) * 100) : 6;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-8 w-full overflow-hidden rounded-md bg-secondary">
        <div
          className={`flex h-full items-center rounded-md ${color} transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ConversionLabel({
  from,
  to,
  verb,
}: {
  from: number;
  to: number;
  verb: string;
}) {
  const rate = from > 0 ? Math.round((to / from) * 100) : 0;
  return (
    <p className="pl-1 text-xs text-muted-foreground">
      ↓ {rate}% {verb}
    </p>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Quote a CSV cell per RFC 4180 (escape quotes, wrap if it contains , " or newline). */
function csvCell(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "event"
  );
}
