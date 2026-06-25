import { NextResponse } from "next/server";
import { rewardRules } from "@/lib/collections";
import type { RewardRule } from "@/lib/types";

const MODES = ["signup", "checkin"] as const;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required." },
      { status: 400 }
    );
  }

  const mode = body.mode as RewardRule["mode"];
  if (!MODES.includes(mode)) {
    return NextResponse.json(
      { error: 'mode must be "signup" or "checkin".' },
      { status: 400 }
    );
  }

  const threshold = Number(body.threshold);
  if (!Number.isFinite(threshold) || threshold < 1) {
    return NextResponse.json(
      { error: "threshold must be a positive number." },
      { status: 400 }
    );
  }

  const rewardLabel =
    typeof body.rewardLabel === "string" ? body.rewardLabel.trim() : "";
  if (!rewardLabel) {
    return NextResponse.json(
      { error: "rewardLabel is required." },
      { status: 400 }
    );
  }

  const rule: RewardRule = {
    _id: eventId,
    mode,
    threshold: Math.floor(threshold),
    rewardLabel,
  };

  const rewardRulesCol = await rewardRules();
  await rewardRulesCol.replaceOne({ _id: eventId }, rule, { upsert: true });

  return NextResponse.json(rule);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId is required." },
      { status: 400 }
    );
  }

  const rewardRulesCol = await rewardRules();
  const rule = await rewardRulesCol.findOne({ _id: eventId });
  if (!rule) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(rule);
}
