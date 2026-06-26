import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const db = client.db();
  const eventsCol = db.collection("events");

  // Find one external event
  const externalEvent = await eventsCol.findOne({ sourceUrl: { $exists: true }, organizerId: { $exists: false } });

  if (externalEvent) {
    await eventsCol.updateOne({ _id: externalEvent._id }, { $set: { clicks: 9, pitchEmailSent: false } });
    console.log(`Set clicks to 9 for event: ${externalEvent.title}`);
  }

  await client.close();
}

main().catch(console.error);
