"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface EventFormValues {
  title: string;
  description: string;
  /** value for an <input type="datetime-local"> */
  startsAt: string;
  location: string;
  /** comma-separated tags */
  tags: string;
  /** seat limit as a string (raw input value) */
  seatLimit: string;
  imageUrl: string;
  sourceUrl: string;
}

/** Shape POSTed to the API once parsed. */
export interface EventFormPayload {
  title: string;
  description: string;
  startsAt: string | null;
  location: string;
  tags: string[];
  seatLimit: number | null;
  imageUrl: string;
  sourceUrl: string;
}

const EMPTY: EventFormValues = {
  title: "",
  description: "",
  startsAt: "",
  location: "",
  tags: "",
  seatLimit: "",
  imageUrl: "",
  sourceUrl: "",
};

/** Convert whatever the AI/initial data gives us into a datetime-local string. */
function toDateTimeLocal(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  // Trim the seconds/timezone — datetime-local wants "YYYY-MM-DDTHH:mm".
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeTags(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return "";
}

interface EventFormProps {
  initial?: Partial<EventFormValues>;
  submitLabel?: string;
  showAiExtract?: boolean;
  onSubmit: (payload: EventFormPayload) => Promise<void>;
}

export default function EventForm({
  initial,
  submitLabel = "Create event",
  showAiExtract = true,
  onSubmit,
}: EventFormProps) {
  const [values, setValues] = React.useState<EventFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [extractUrl, setExtractUrl] = React.useState("");
  const [extracting, setExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  function update<K extends keyof EventFormValues>(
    key: K,
    value: EventFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleExtract() {
    if (!extractUrl.trim()) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: extractUrl.trim() }),
      });
      if (!res.ok) {
        throw new Error(`Extraction failed (${res.status})`);
      }
      const data = await res.json();
      setValues((prev) => ({
        ...prev,
        title: data.title ?? prev.title,
        description: data.description ?? prev.description,
        startsAt: data.startsAt
          ? toDateTimeLocal(data.startsAt)
          : data.date
            ? toDateTimeLocal(data.date)
            : prev.startsAt,
        location: data.location ?? prev.location,
        tags: data.tags ? normalizeTags(data.tags) : prev.tags,
        seatLimit:
          data.seatLimit != null ? String(data.seatLimit) : prev.seatLimit,
        imageUrl: data.imageUrl ?? prev.imageUrl,
        sourceUrl: data.sourceUrl ?? extractUrl.trim(),
      }));
    } catch (err) {
      setExtractError(
        err instanceof Error
          ? `${err.message}. You can still fill the form manually.`
          : "Could not extract. You can still fill the form manually."
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: EventFormPayload = {
        title: values.title.trim(),
        description: values.description.trim(),
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : null,
        location: values.location.trim(),
        tags: values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        seatLimit: values.seatLimit.trim()
          ? Number(values.seatLimit)
          : null,
        imageUrl: values.imageUrl.trim(),
        sourceUrl: values.sourceUrl.trim(),
      };
      await onSubmit(payload);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {showAiExtract && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Sparkles className="h-4 w-4" />
              AI Extract
            </CardTitle>
            <CardDescription>
              Paste a link to an event page and let AI prefill the form for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="url"
                placeholder="https://example.com/event"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                className="bg-white"
              />
              <Button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !extractUrl.trim()}
                className="shrink-0"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract with AI
                  </>
                )}
              </Button>
            </div>
            {extractError && (
              <p className="text-sm text-destructive">{extractError}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Title" htmlFor="title" required>
              <Input
                id="title"
                required
                value={values.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Community meetup in Würzburg"
              />
            </Field>

            <Field label="Description" htmlFor="description">
              <textarea
                id="description"
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="What is this event about?"
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Date & time" htmlFor="startsAt">
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={values.startsAt}
                  onChange={(e) => update("startsAt", e.target.value)}
                />
              </Field>

              <Field label="Location" htmlFor="location">
                <Input
                  id="location"
                  value={values.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Marktplatz, Würzburg"
                />
              </Field>
            </div>

            <Field
              label="Tags"
              htmlFor="tags"
              hint="Comma separated, e.g. music, family, free"
            >
              <Input
                id="tags"
                value={values.tags}
                onChange={(e) => update("tags", e.target.value)}
                placeholder="music, family, free"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Seat limit" htmlFor="seatLimit">
                <Input
                  id="seatLimit"
                  type="number"
                  min={0}
                  value={values.seatLimit}
                  onChange={(e) => update("seatLimit", e.target.value)}
                  placeholder="100"
                />
              </Field>

              <Field label="Image URL" htmlFor="imageUrl">
                <Input
                  id="imageUrl"
                  type="url"
                  value={values.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="https://…/poster.jpg"
                />
              </Field>
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
