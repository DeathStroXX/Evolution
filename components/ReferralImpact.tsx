"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n";

interface ImpactData {
  peopleBrought: number;
  countByReason: { share: number; signup: number; checkin: number };
}

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: ImpactData };

/**
 * Referral impact summary — fetches the user's aggregated points from
 * /api/points and headlines how many people they've brought to events.
 */
export default function ReferralImpact() {
  const { t } = useLanguage();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/points", { cache: "no-store" });
        if (!res.ok) throw new Error("request failed");
        const data = (await res.json()) as ImpactData;
        if (!cancelled) setState({ status: "ready", data });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("points.impact")}</CardTitle>
        <CardDescription>{t("points.impactSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "loading" && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Loading your impact…
          </p>
        )}

        {state.status === "error" && (
          <p className="text-sm text-destructive" role="alert">
            We couldn&rsquo;t load your referral impact right now.
          </p>
        )}

        {state.status === "ready" && (
          <div className="flex flex-col gap-6">
            <p className="text-lg">
              {t("points.brought", { n: state.data.peopleBrought })}
            </p>

            <div className="grid grid-cols-3 gap-4">
              <ImpactStat
                label={t("points.shares")}
                value={state.data.countByReason.share}
              />
              <ImpactStat
                label={t("points.signups")}
                value={state.data.countByReason.signup}
              />
              <ImpactStat
                label={t("points.checkins")}
                value={state.data.countByReason.checkin}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImpactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
