import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("community_connect");
  const events = await db.collection("events").find({ isAutoIngested: true }).toArray();
  console.log(JSON.stringify(events, null, 2));
  await client.close();
}

main().catch(console.error);
