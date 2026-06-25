"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RewardRule {
  _id: string;
  mode: "signup" | "checkin";
  threshold: number;
  rewardLabel: string;
}

export default function RewardRulesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [mode, setMode] = React.useState<"signup" | "checkin">("checkin");
  const [threshold, setThreshold] = React.useState("5");
  const [rewardLabel, setRewardLabel] = React.useState("");

  const [current, setCurrent] = React.useState<RewardRule | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/reward-rules?eventId=${encodeURIComponent(eventId)}`
        );
        if (cancelled) return;
        if (res.ok) {
          const rule: RewardRule = await res.json();
          setCurrent(rule);
          setMode(rule.mode);
          setThreshold(String(rule.threshold));
          setRewardLabel(rule.rewardLabel);
        }
        // 404 simply means no rule yet — leave defaults.
      } catch {
        // Ignore fetch errors on load; the form still works.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/reward-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          mode,
          threshold: Number(threshold),
          rewardLabel: rewardLabel.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to save reward rule.");
      }
      const rule: RewardRule = await res.json();
      setCurrent(rule);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to event
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Reward rules</h1>
        <p className="text-sm text-muted-foreground">
          Reward members who bring the most attendees to this event.
        </p>
      </div>

      {current && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Trophy className="h-4 w-4" />
              Current reward
            </CardTitle>
            <CardDescription>
              Unlocks <span className="font-medium">{current.rewardLabel}</span>{" "}
              after {current.threshold}{" "}
              {current.mode === "checkin" ? "check-ins" : "sign-ups"}.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {current ? "Update reward rule" : "Set reward rule"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="mode"
                    className="text-sm font-medium leading-none"
                  >
                    Mode
                  </label>
                  <select
                    id="mode"
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as "signup" | "checkin")
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="signup">Sign-ups</option>
                    <option value="checkin">Check-ins</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Count referred sign-ups or actual check-ins.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="threshold"
                    className="text-sm font-medium leading-none"
                  >
                    Threshold
                  </label>
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    How many are needed to unlock the reward.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="rewardLabel"
                  className="text-sm font-medium leading-none"
                >
                  Reward label
                </label>
                <Input
                  id="rewardLabel"
                  required
                  value={rewardLabel}
                  onChange={(e) => setRewardLabel(e.target.value)}
                  placeholder="Hoodie from IT-Mainfranken"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {saved && (
                <p className="text-sm font-medium text-foreground">
                  Reward rule saved.
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : current ? (
                    "Update reward rule"
                  ) : (
                    "Save reward rule"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
