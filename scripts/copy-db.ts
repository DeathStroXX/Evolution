import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const dbTest = client.db();
  const dbComm = client.db("community_connect");

  const eventsToCopy = await dbComm.collection("events").find({}).toArray();
  if (eventsToCopy.length > 0) {
    // Avoid duplicate key errors on _id by using ordered: false
    try {
      await dbTest.collection("events").insertMany(eventsToCopy, { ordered: false });
    } catch (e: any) {
      console.log("Some duplicates skipped.");
    }
  }

  console.log(`Copied ${eventsToCopy.length} events to the main test database.`);
  await client.close();
}

main().catch(console.error);
