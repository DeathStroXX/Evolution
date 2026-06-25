import { NextResponse } from "next/server";
import { registrations } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  if (!eventId || !userId) {
    return NextResponse.json(
      { error: "eventId and userId are required" },
      { status: 400 }
    );
  }

  const col = await registrations();
  const registration = await col.findOne({ eventId, userId });

  if (!registration) {
    return NextResponse.json({ registered: false });
  }

  return NextResponse.json({ registered: true, registration });
}
