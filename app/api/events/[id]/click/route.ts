import { NextResponse } from "next/server";
import { events } from "@/lib/collections";
import { sendPitchEmail } from "@/lib/emailService";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const eventsCol = await events();
  
  const event = await eventsCol.findOne({ _id: params.id });
  
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Increment clicks
  const newClicks = (event.clicks || 0) + 1;

  // We only care about external auto-ingested events (they have a sourceUrl but no organizerId)
  const isExternal = !!event.sourceUrl && !event.organizerId;
  const thresholdReached = newClicks >= 10;
  const shouldSendPitch = isExternal && thresholdReached && !event.pitchEmailSent;

  const updateFields: any = { clicks: newClicks };

  if (shouldSendPitch) {
    updateFields.pitchEmailSent = true;
    // Fire and forget the email service (don't await so the click response is fast)
    sendPitchEmail(event.title, newClicks, event.sourceUrl!).catch(console.error);
  }

  await eventsCol.updateOne({ _id: params.id }, { $set: updateFields });

  return NextResponse.json({ success: true, clicks: newClicks });
}
