"use client";

import { useRouter } from "next/navigation";
import EventForm, { type EventFormPayload } from "@/components/EventForm";

export default function NewEventPage() {
  const router = useRouter();

  async function handleSubmit(payload: EventFormPayload) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to create event.");
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Event</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Extract details from a link with AI, or fill the form manually.
        </p>
      </div>
      <EventForm onSubmit={handleSubmit} submitLabel="Create event" />
    </div>
  );
}
