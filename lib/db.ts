import { MongoClient, Db, Collection, Document } from "mongodb";

const uri = process.env.MONGODB_URI!;

declare global {
  var _mongo: Promise<MongoClient> | undefined;
}

if (!global._mongo) global._mongo = new MongoClient(uri).connect();

export async function db(): Promise<Db> {
  const client = await global._mongo!;
  return client.db();
}

export async function col<T extends Document>(name: string): Promise<Collection<T>> {
  return (await db()).collection<T>(name);
}
