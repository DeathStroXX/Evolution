import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const dbTest = client.db();
  const dbComm = client.db("community_connect");

  const testEvents = await dbTest.collection("events").countDocuments();
  const commEvents = await dbComm.collection("events").countDocuments();

  console.log(`Events in test DB: ${testEvents}`);
  console.log(`Events in community_connect DB: ${commEvents}`);

  await client.close();
}

main().catch(console.error);
