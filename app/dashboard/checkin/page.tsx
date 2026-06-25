"use client";

import * as React from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, XCircle, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const REGION_ID = "qr-reader-region";

type ScanResult =
  | { ok: true; attendeeName: string; rewardUnlocked: boolean }
  | { ok: false; message: string };

type Status = "starting" | "scanning" | "processing" | "result";

export default function CheckinPage() {
  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  // Guards against the success callback firing repeatedly for the same frame.
  const lockRef = React.useRef(false);
  const [status, setStatus] = React.useState<Status>("starting");
  const [result, setResult] = React.useState<ScanResult | null>(null);

  const handleDecoded = React.useCallback(async (decodedText: string) => {
    if (lockRef.current) return;
    lockRef.current = true;

    // Pause the live video feed while we process this scan.
    try {
      scannerRef.current?.pause(true);
    } catch {
      // Scanner may already be stopping; ignore.
    }
    setStatus("processing");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: decodedText.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setResult({
          ok: true,
          attendeeName: data.attendeeName ?? "Attendee",
          rewardUnlocked: Boolean(data.rewardUnlocked),
        });
      } else {
        setResult({
          ok: false,
          message: data?.error ?? "Check-in failed. Please try again.",
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setStatus("result");
    }
  }, []);

  // Initialize the scanner once on mount; tear it down on unmount.
  React.useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(REGION_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          void handleDecoded(decodedText);
        },
        undefined
      )
      .then(() => {
        if (!cancelled) setStatus("scanning");
      })
      .catch(() => {
        if (!cancelled) {
          setResult({
            ok: false,
            message:
              "Could not access the camera. Check permissions and reload.",
          });
          setStatus("result");
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (!s) return;
      // stop() rejects if the scanner never fully started — clear() regardless.
      s.stop()
        .then(() => s.clear())
        .catch(() => {
          try {
            s.clear();
          } catch {
            // Nothing more we can do during teardown.
          }
        });
    };
  }, [handleDecoded]);

  function scanNext() {
    setResult(null);
    lockRef.current = false;
    try {
      scannerRef.current?.resume();
      setStatus("scanning");
    } catch {
      // If resume fails the camera feed is gone; ask the user to reload.
      setResult({
        ok: false,
        message: "Scanner stopped. Please reload the page.",
      });
      setStatus("result");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold">Check-in Scanner</h1>
        <span className="text-sm text-white/60">
          {status === "scanning"
            ? "Point the camera at a ticket QR"
            : status === "processing"
              ? "Checking in…"
              : status === "starting"
                ? "Starting camera…"
                : ""}
        </span>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {/* html5-qrcode renders the live camera feed into this element. */}
        <div id={REGION_ID} className="w-full max-w-md" />

        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Starting camera…</p>
          </div>
        )}

        {status === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950/80">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-white/80">Checking in…</p>
          </div>
        )}

        {status === "result" && result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-neutral-950/95 px-8 text-center">
            {result.ok ? (
              <>
                <CheckCircle2
                  className="h-28 w-28 text-primary"
                  style={{
                    animation: "checkin-pop 0.4s ease-out",
                  }}
                />
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-primary">
                    Checked in!
                  </p>
                  <p className="text-lg text-white/90">
                    {result.attendeeName}
                  </p>
                </div>
                {result.rewardUnlocked && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-500/15 px-4 py-2 text-amber-300">
                    <Trophy className="h-5 w-5" />
                    <span className="font-medium">
                      Referral reward unlocked!
                    </span>
                  </div>
                )}

                {/* Community connections — give the organizer something to
                    suggest to the attendee at the check-in desk. */}
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
                  <p className="text-sm font-semibold text-white/90">
                    Community connections
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Suggest to the attendee:
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href="https://discord.gg/yTF5KK3QpQ"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <span>Join Mainfranken Discord</span>
                      <span aria-hidden="true" className="text-white/40">↗</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/company/it-mainfranken"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <span>Follow IT-Mainfranken on LinkedIn</span>
                      <span aria-hidden="true" className="text-white/40">↗</span>
                    </a>
                    <a
                      href="/events"
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <span>Browse more events</span>
                      <span aria-hidden="true" className="text-white/40">→</span>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-28 w-28 text-red-500" />
                <p className="max-w-sm text-xl font-medium text-red-400">
                  {result.message}
                </p>
              </>
            )}

            <Button onClick={scanNext} size="lg" className="mt-2">
              Scan Next
            </Button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes checkin-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
