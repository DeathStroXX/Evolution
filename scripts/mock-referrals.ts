import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const db = client.db();
  const profilesCol = db.collection("profiles");
  const ledgerCol = db.collection("points_ledger");

  // Create 3 mock profiles
  const profiles = [
    { _id: "user-alpha", name: "Alice Hacker", email: "alice@example.com", interests: ["AI"], createdAt: new Date() },
    { _id: "user-beta", name: "Bob Builder", email: "bob@example.com", interests: ["Startup"], createdAt: new Date() },
    { _id: "user-gamma", name: "Charlie Coder", email: "charlie@example.com", interests: ["Design"], createdAt: new Date() },
  ];

  for (const p of profiles) {
    await profilesCol.updateOne({ _id: p._id }, { $set: p }, { upsert: true });
  }

  // Insert some referral signup points for them
  const dummyEventId = "dummy-event-123";
  const points = [];

  // Alice referred 6 people (Level 2)
  for (let i = 0; i < 6; i++) {
    points.push({
      _id: randomUUID(),
      userId: "user-alpha",
      eventId: dummyEventId,
      reason: "signup",
      points: 20,
      dedupeKey: `signup:user-alpha:${dummyEventId}:dummy-referee-alice-${i}`,
      createdAt: new Date(),
    });
  }

  // Bob referred 12 people (Level 3)
  for (let i = 0; i < 12; i++) {
    points.push({
      _id: randomUUID(),
      userId: "user-beta",
      eventId: dummyEventId,
      reason: "signup",
      points: 20,
      dedupeKey: `signup:user-beta:${dummyEventId}:dummy-referee-bob-${i}`,
      createdAt: new Date(),
    });
  }

  // Charlie referred 2 people (Level 1)
  for (let i = 0; i < 2; i++) {
    points.push({
      _id: randomUUID(),
      userId: "user-gamma",
      eventId: dummyEventId,
      reason: "signup",
      points: 20,
      dedupeKey: `signup:user-gamma:${dummyEventId}:dummy-referee-charlie-${i}`,
      createdAt: new Date(),
    });
  }

  for (const p of points) {
    await ledgerCol.updateOne(
      { dedupeKey: p.dedupeKey },
      { $setOnInsert: p },
      { upsert: true }
    );
  }

  console.log("Mock referral data inserted!");
  await client.close();
}

main().catch(console.error);
