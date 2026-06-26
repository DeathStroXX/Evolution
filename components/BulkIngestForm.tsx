"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BulkIngestForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleIngest() {
    if (!url.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ingest-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`);
      }

      if (data.count === 0) {
        setMessage({ type: "error", text: "No events were found on that page." });
      } else {
        setMessage({ type: "success", text: data.message });
        setUrl("");
        // Refresh the page to show the newly added events
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to ingest events." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-foreground">
          <UploadCloud className="h-4 w-4" />
          Bulk AI Ingestion
        </CardTitle>
        <CardDescription>
          Paste a link to an index page (like a university events page) and extract all events directly into your database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://example.com/events"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white"
            disabled={loading}
          />
          <Button
            type="button"
            onClick={handleIngest}
            disabled={loading || !url.trim()}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ingesting…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto Ingest
              </>
            )}
          </Button>
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.type === "error" ? "text-destructive" : "text-green-600 font-medium"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
