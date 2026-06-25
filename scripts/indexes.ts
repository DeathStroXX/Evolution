import {
  referrals,
  registrations,
  pointsLedger,
} from "@/lib/collections";

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local before running.");
  }

  await (await referrals()).createIndex({ code: 1 }, { unique: true });
  await (await referrals()).createIndex(
    { eventId: 1, referrerId: 1 },
    { unique: true }
  );
  await (await registrations()).createIndex(
    { eventId: 1, userId: 1 },
    { unique: true }
  );
  await (await pointsLedger()).createIndex(
    { dedupeKey: 1 },
    { unique: true }
  );

  console.log("Indexes created.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
