/**
 * Comprehensive demo seed.
 *
 *   npx tsx scripts/seed-demo.ts
 *
 * Populates the database with a realistic, internally-consistent story so every
 * feature looks alive during a pitch: an organizer (Lisa), three events with
 * reward rules, six community members, registrations, referral chains, and the
 * matching points-ledger + check-in records.
 *
 * The script is idempotent — it removes any prior demo data (identified by the
 * @demo.local email suffix / Lisa's organizer id) before inserting fresh data.
 *
 * Field names, collection names, id derivation, and dedupeKey patterns are kept
 * byte-for-byte in sync with the app (lib/auth.ts, lib/collections.ts, and the
 * /api routes). Do not change them here without changing them there too.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID, createHash } from "crypto";
import type {
  Profile,
  Event,
  Registration,
  Referral,
  PointsEntry,
  RewardRule,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Env: support a bare `npx tsx scripts/seed-demo.ts` by loading .env.local
// ourselves when MONGODB_URI isn't already in the environment. Must run before
// we import anything that opens the Mongo connection at module load.
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  if (process.env.MONGODB_URI) return;
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env.local — fall through; the missing-URI check below will report it.
  }
}

/** Deterministic 24-char id derived from the email — must match lib/auth.ts. */
function idForEmail(email: string): string {
  return createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 24);
}

// ---------------------------------------------------------------------------
// Cast of characters
// ---------------------------------------------------------------------------
const ORGANIZER = { name: "Lisa Meier", email: "lisa@demo.local" };

const USERS = {
  max: { name: "Max Schmidt", email: "max@demo.local" },
  anna: { name: "Anna Weber", email: "anna@demo.local" },
  jonas: { name: "Jonas Fischer", email: "jonas@demo.local" },
  sophie: { name: "Sophie Müller", email: "sophie@demo.local" },
  lena: { name: "Lena Hoffmann", email: "lena@demo.local" },
  tom: { name: "Tom Braun", email: "tom@demo.local" },
} as const;
type UserKey = keyof typeof USERS;

const userId = (key: UserKey) => idForEmail(USERS[key].email);
const lisaId = idForEmail(ORGANIZER.email);

// ---------------------------------------------------------------------------
// Events + reward rules
// ---------------------------------------------------------------------------
const EVENTS = {
  ai: {
    _id: randomUUID(),
    title: "AI Week Mainfranken 2026",
    description:
      "A week of talks, hands-on workshops, and live demos exploring how artificial intelligence and machine learning are transforming the Mainfranken region. Join researchers, engineers, and founders for deep-dives on LLMs, applied ML, and the future of AI in regional industry.",
    startsAt: new Date("2026-07-16T10:00:00+02:00"),
    location: "ZDI Mainfranken, Würzburg",
    tags: ["AI", "Machine Learning"],
    coverImage:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
    reward: { rewardLabel: "€50 Lovable Credit", threshold: 3 },
  },
  sn: {
    _id: randomUUID(),
    title: "Startup Night Schweinfurt",
    description:
      "An evening of startup pitches where early-stage founders from Schweinfurt and the wider region present their ventures to investors, mentors, and the local community — capped off with open networking and drinks.",
    startsAt: new Date("2026-07-05T18:00:00+02:00"),
    location: "Kunsthalle Schweinfurt",
    tags: ["Startups", "Networking"],
    coverImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
    reward: { rewardLabel: "Exclusive AI Workshop Pass", threshold: 5 },
  },
  dv: {
    _id: randomUUID(),
    title: "DevOps Meetup Würzburg",
    description:
      "A practical meetup for engineers running modern infrastructure. Talks and open discussion on CI/CD pipelines, cloud platforms, Kubernetes in production, and observability — with plenty of time to swap war stories.",
    startsAt: new Date("2026-07-12T18:30:00+02:00"),
    location: "Coworking Space Würzburg",
    tags: ["DevOps", "Cloud"],
    coverImage:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop",
    reward: { rewardLabel: "3 Months Free Notion Plus", threshold: 2 },
  },
} as const;
type EventKey = keyof typeof EVENTS;

const eventId = (key: EventKey) => EVENTS[key]._id;

// ---------------------------------------------------------------------------
// Referral chains. Each action produces one points-ledger entry, attributed to
// the referrer who earns the points. Listed oldest → newest so timestamps and
// the activity ticker read naturally (shares first, check-ins most recent).
// ---------------------------------------------------------------------------
const POINTS = { share: 5, signup: 20, checkin: 50 } as const;

type Action =
  | { kind: "share"; ev: EventKey; by: UserKey; platform: string }
  | { kind: "signup"; ev: EventKey; by: UserKey; who: UserKey }
  | { kind: "checkin"; ev: EventKey; by: UserKey; who: UserKey };

const ACTIONS: Action[] = [
  // --- AI Week ---
  { kind: "share", ev: "ai", by: "max", platform: "whatsapp" },
  { kind: "signup", ev: "ai", by: "max", who: "anna" },
  { kind: "share", ev: "ai", by: "max", platform: "linkedin" },
  { kind: "signup", ev: "ai", by: "max", who: "jonas" },
  { kind: "share", ev: "ai", by: "anna", platform: "whatsapp" },
  { kind: "signup", ev: "ai", by: "anna", who: "lena" },
  { kind: "share", ev: "ai", by: "max", platform: "telegram" },
  { kind: "signup", ev: "ai", by: "max", who: "sophie" },
  { kind: "share", ev: "ai", by: "jonas", platform: "x" },
  // --- Startup Night ---
  { kind: "share", ev: "sn", by: "jonas", platform: "x" },
  { kind: "signup", ev: "sn", by: "jonas", who: "max" },
  // --- AI Week (continued) ---
  { kind: "share", ev: "ai", by: "anna", platform: "linkedin" },
  { kind: "signup", ev: "ai", by: "anna", who: "tom" },
  // --- Startup Night (continued) ---
  { kind: "share", ev: "sn", by: "anna", platform: "telegram" },
  { kind: "signup", ev: "sn", by: "anna", who: "sophie" },
  // --- DevOps Meetup ---
  { kind: "share", ev: "dv", by: "max", platform: "whatsapp" },
  { kind: "signup", ev: "dv", by: "max", who: "lena" },
  { kind: "share", ev: "dv", by: "jonas", platform: "linkedin" },
  // --- Most recent: the check-ins ---
  { kind: "checkin", ev: "ai", by: "anna", who: "lena" },
  { kind: "checkin", ev: "ai", by: "max", who: "anna" },
  { kind: "checkin", ev: "dv", by: "max", who: "lena" },
];

// Registrations. `via` means the user registered through that referrer's link.
interface RegSpec {
  ev: EventKey;
  user: UserKey;
  via?: UserKey;
  checkedIn?: boolean;
}
const REGISTRATIONS: RegSpec[] = [
  // AI Week — all six members
  { ev: "ai", user: "anna", via: "max", checkedIn: true },
  { ev: "ai", user: "jonas", via: "max" },
  { ev: "ai", user: "sophie", via: "max" },
  { ev: "ai", user: "lena", via: "anna", checkedIn: true },
  { ev: "ai", user: "tom", via: "anna" },
  { ev: "ai", user: "max" }, // organic
  // Startup Night
  { ev: "sn", user: "sophie", via: "anna" },
  { ev: "sn", user: "max", via: "jonas" },
  { ev: "sn", user: "anna" }, // organic
  { ev: "sn", user: "jonas" }, // organic
  // DevOps Meetup
  { ev: "dv", user: "lena", via: "max", checkedIn: true },
  { ev: "dv", user: "max" }, // organic
  { ev: "dv", user: "jonas" }, // organic
];

// ---------------------------------------------------------------------------
// Timestamps spread across the last ~7 days (oldest action → newest).
// ---------------------------------------------------------------------------
const NOW = Date.now();
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

function timestampFor(index: number, total: number): Date {
  const maxAgoMin = 6.8 * 24 * 60; // ~6.8 days ago
  const minAgoMin = 4; // ~4 min ago (so the ticker reads "4 min ago")
  const frac = total <= 1 ? 0 : index / (total - 1);
  const agoMin = maxAgoMin - frac * (maxAgoMin - minAgoMin);
  return new Date(NOW - agoMin * MIN);
}

async function main() {
  loadEnvLocal();
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local before running."
    );
  }

  // Import after env load so the Mongo client connects with a valid URI.
  const {
    profiles,
    events,
    registrations,
    referrals,
    pointsLedger,
    rewardRules,
  } = await import("@/lib/collections");

  const [
    profilesCol,
    eventsCol,
    registrationsCol,
    referralsCol,
    ledgerCol,
    rewardRulesCol,
  ] = await Promise.all([
    profiles(),
    events(),
    registrations(),
    referrals(),
    pointsLedger(),
    rewardRules(),
  ]);

  // ---- Idempotent cleanup -------------------------------------------------
  const demoEmails = [
    ORGANIZER.email,
    ...Object.values(USERS).map((u) => u.email),
  ];
  const knownUserIds = demoEmails.map(idForEmail);

  // Catch any stray demo profiles created with a different casing, too.
  const strayProfiles = await profilesCol
    .find({ email: { $regex: /@demo\.local$/i } })
    .toArray();
  const allUserIds = Array.from(
    new Set([...knownUserIds, ...strayProfiles.map((p) => String(p._id))])
  );

  const oldEvents = await eventsCol.find({ organizerId: lisaId }).toArray();
  const oldEventIds = oldEvents.map((e) => String(e._id));

  // Reward rules are keyed by event _id and carry no user linkage, so if a
  // prior run's events were already deleted elsewhere (e.g. by scripts/seed.ts
  // wiping the events collection) they'd orphan. Also match on the demo reward
  // labels so cleanup stays idempotent regardless.
  const demoRewardLabels = (Object.keys(EVENTS) as EventKey[]).map(
    (key) => EVENTS[key].reward.rewardLabel
  );

  const del = await Promise.all([
    rewardRulesCol.deleteMany({
      $or: [
        { _id: { $in: oldEventIds } },
        { rewardLabel: { $in: demoRewardLabels } },
      ],
    }),
    ledgerCol.deleteMany({
      $or: [{ userId: { $in: allUserIds } }, { eventId: { $in: oldEventIds } }],
    }),
    referralsCol.deleteMany({
      $or: [
        { referrerId: { $in: allUserIds } },
        { eventId: { $in: oldEventIds } },
      ],
    }),
    registrationsCol.deleteMany({
      $or: [{ userId: { $in: allUserIds } }, { eventId: { $in: oldEventIds } }],
    }),
    eventsCol.deleteMany({ organizerId: lisaId }),
    profilesCol.deleteMany({ _id: { $in: allUserIds } }),
  ]);
  const deletedTotal = del.reduce((sum, r) => sum + (r.deletedCount ?? 0), 0);
  console.log(`🧹 Cleaned up ${deletedTotal} existing demo document(s).\n`);

  // ---- Profiles -----------------------------------------------------------
  const accountCreatedAt = new Date(NOW - 8 * DAY);
  const profileDocs: Profile[] = [
    {
      _id: lisaId,
      name: ORGANIZER.name,
      email: ORGANIZER.email,
      interests: [],
      createdAt: accountCreatedAt,
    },
    ...(Object.keys(USERS) as UserKey[]).map((key) => ({
      _id: userId(key),
      name: USERS[key].name,
      email: USERS[key].email,
      interests: [],
      createdAt: accountCreatedAt,
    })),
  ];

  // ---- Events + reward rules ---------------------------------------------
  const eventDocs: Event[] = (Object.keys(EVENTS) as EventKey[]).map((key) => {
    const e = EVENTS[key];
    // Some events ship a cover image; store it in the schema's `imageUrl` field
    // (what the catalog page maps + EventsGrid renders). Others fall back to the
    // app's gradient placeholder.
    const cover = (e as { coverImage?: string }).coverImage;
    return {
      _id: e._id,
      title: e.title,
      description: e.description,
      startsAt: e.startsAt,
      location: e.location,
      imageUrl: cover,
      tags: [...e.tags],
      organizerId: lisaId,
      createdAt: accountCreatedAt,
    };
  });

  const rewardRuleDocs: RewardRule[] = (Object.keys(EVENTS) as EventKey[]).map(
    (key) => ({
      _id: EVENTS[key]._id,
      mode: "signup", // "N referrals" == N referred sign-ups
      threshold: EVENTS[key].reward.threshold,
      rewardLabel: EVENTS[key].reward.rewardLabel,
    })
  );

  // ---- Referrals: one code per (referrer, event) that appears in a chain --
  const referralByPair = new Map<string, Referral>();
  function ensureReferral(by: UserKey, ev: EventKey): Referral {
    const pairKey = `${by}:${ev}`;
    let ref = referralByPair.get(pairKey);
    if (!ref) {
      ref = {
        _id: randomUUID(),
        eventId: eventId(ev),
        referrerId: userId(by),
        code: randomUUID().slice(0, 8),
        clicks: 4 + referralByPair.size * 3, // plausible, deterministic
        createdAt: new Date(NOW - 6.5 * DAY),
      };
      referralByPair.set(pairKey, ref);
    }
    return ref;
  }
  // Every share / signup implies the referrer has a referral code for the event.
  for (const a of ACTIONS) {
    if (a.kind === "share" || a.kind === "signup") ensureReferral(a.by, a.ev);
  }
  const referralCode = (by: UserKey, ev: EventKey) =>
    referralByPair.get(`${by}:${ev}`)!.code;

  // ---- Points ledger (+ collect registration timing) ----------------------
  const total = ACTIONS.length;
  const signupTime = new Map<string, Date>(); // `${ev}:${who}` -> signup time
  const checkinTime = new Map<string, Date>(); // `${ev}:${who}` -> checkin time
  const ledgerDocs: PointsEntry[] = [];

  ACTIONS.forEach((a, i) => {
    const at = timestampFor(i, total);
    const evId = eventId(a.ev);
    const byId = userId(a.by);

    if (a.kind === "share") {
      ledgerDocs.push({
        _id: randomUUID(),
        userId: byId,
        eventId: evId,
        reason: "share",
        points: POINTS.share,
        dedupeKey: `share:${byId}:${evId}:${a.platform}`,
        platform: a.platform,
        createdAt: at,
      });
    } else if (a.kind === "signup") {
      const whoId = userId(a.who);
      signupTime.set(`${a.ev}:${a.who}`, at);
      ledgerDocs.push({
        _id: randomUUID(),
        userId: byId,
        eventId: evId,
        reason: "signup",
        points: POINTS.signup,
        dedupeKey: `signup:${byId}:${evId}:${whoId}`,
        createdAt: at,
      });
    } else {
      const whoId = userId(a.who);
      checkinTime.set(`${a.ev}:${a.who}`, at);
      ledgerDocs.push({
        _id: randomUUID(),
        userId: byId,
        eventId: evId,
        reason: "checkin",
        points: POINTS.checkin,
        dedupeKey: `checkin:${byId}:${evId}:${whoId}`,
        createdAt: at,
      });
    }
  });

  // ---- Registrations ------------------------------------------------------
  const organicCreatedAt = new Date(NOW - 6.5 * DAY);
  const registrationDocs: Registration[] = REGISTRATIONS.map((r) => {
    const key = `${r.ev}:${r.user}`;
    const createdAt = r.via
      ? new Date((signupTime.get(key)?.getTime() ?? NOW) - MIN)
      : organicCreatedAt;
    const checkedInAt = r.checkedIn ? checkinTime.get(key) : undefined;
    return {
      _id: randomUUID(),
      eventId: eventId(r.ev),
      userId: userId(r.user),
      referralCode: r.via ? referralCode(r.via, r.ev) : undefined,
      checkedIn: Boolean(r.checkedIn),
      checkedInAt,
      createdAt,
    };
  });

  // ---- Insert everything --------------------------------------------------
  await profilesCol.insertMany(profileDocs as unknown as Profile[]);
  await eventsCol.insertMany(eventDocs as unknown as Event[]);
  await rewardRulesCol.insertMany(rewardRuleDocs as unknown as RewardRule[]);
  await referralsCol.insertMany(
    Array.from(referralByPair.values()) as unknown as Referral[]
  );
  await registrationsCol.insertMany(
    registrationDocs as unknown as Registration[]
  );
  await ledgerCol.insertMany(ledgerDocs as unknown as PointsEntry[]);

  // ---- Summary ------------------------------------------------------------
  printSummary({
    profiles: profileDocs.length,
    events: eventDocs,
    rewardRules: rewardRuleDocs,
    referrals: referralByPair.size,
    registrations: registrationDocs,
    ledger: ledgerDocs,
  });
}

function printSummary(data: {
  profiles: number;
  events: Event[];
  rewardRules: RewardRule[];
  referrals: number;
  registrations: Registration[];
  ledger: PointsEntry[];
}) {
  const checkins = data.registrations.filter((r) => r.checkedIn).length;
  const byReason = (reason: PointsEntry["reason"]) =>
    data.ledger.filter((e) => e.reason === reason).length;
  const totalPoints = data.ledger.reduce((s, e) => s + e.points, 0);

  console.log("✅ Demo data seeded successfully.\n");
  console.log("   Created:");
  console.log(`   • ${data.profiles} profiles (1 organizer + 6 members)`);
  console.log(`   • ${data.events.length} events:`);
  for (const e of data.events) console.log(`       – ${e.title}`);
  console.log(`   • ${data.rewardRules.length} reward rules:`);
  for (const r of data.rewardRules) {
    console.log(
      `       – ${r.rewardLabel} (${r.threshold} ${r.mode} referrals)`
    );
  }
  console.log(`   • ${data.referrals} referral codes`);
  console.log(
    `   • ${data.registrations.length} registrations (${checkins} checked in)`
  );
  console.log(
    `   • ${data.ledger.length} points-ledger entries ` +
      `(${byReason("share")} shares, ${byReason("signup")} sign-ups, ${byReason(
        "checkin"
      )} check-ins) totalling ${totalPoints} pts`
  );

  console.log("\n   Top referrer (Max Schmidt) earns across all events — Gold tier with badges.");
  console.log("\n────────────────────────────────────────────────────────");
  console.log("Login as Lisa (organizer): lisa@demo.local");
  console.log("Login as Max (top referrer): max@demo.local");
  console.log("────────────────────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
