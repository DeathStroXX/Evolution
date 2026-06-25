import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { registrations } from "@/lib/collections";
import type { Registration } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const userId = cookies().get("session")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { eventId?: string; referralCode?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const eventId = body.eventId;
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const registration: Registration = {
    _id: randomUUID(),
    eventId,
    userId,
    referralCode: body.referralCode,
    checkedIn: false,
    createdAt: new Date(),
  };

  try {
    const col = await registrations();
    await col.insertOne(registration);
  } catch (err) {
    // Unique index on { eventId, userId } -> duplicate registration.
    if (err && typeof err === "object" && (err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json(registration, { status: 201 });
}
