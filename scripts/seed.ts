import { randomUUID } from "crypto";
import { events, rewardRules } from "@/lib/collections";
import type { Event, RewardRule } from "@/lib/types";

/**
 * Catalog seed — real Würzburg / Mainfranken region tech events.
 *
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * SCOPING: this script owns events with organizerId === "seed-organizer" and
 * only ever deletes those (plus the previous generic seed's "demo-organizer"
 * events). It must NOT touch seed-demo.ts's data, whose events are owned by
 * Lisa's hashed organizer id — so the two seeds never clobber each other.
 */

// Organizer id this seed owns. Distinct from seed-demo.ts (Lisa's hashed id).
const ORGANIZER_ID = "seed-organizer";
// The previous generic seed used this id; clean it up so the old fake catalog
// is removed on the first run of this rewrite.
const LEGACY_ORGANIZER_ID = "demo-organizer";

// Each event carries its own cover so adjacent cards look different. The app
// renders `imageUrl`, so makeEvent mirrors coverImage → imageUrl below.
type SeedEvent = Event & { coverImage: string };

function makeEvent(
  data: Omit<SeedEvent, "_id" | "organizerId" | "createdAt" | "imageUrl">
): SeedEvent {
  return {
    _id: randomUUID(),
    organizerId: ORGANIZER_ID,
    createdAt: new Date(),
    // The catalog + event detail pages read imageUrl; keep coverImage in sync.
    imageUrl: data.coverImage,
    ...data,
  };
}

// Reward rules attached to two of this seed's events. Keyed by event TITLE
// here; resolved to the freshly-inserted event _id at seed time (a RewardRule's
// _id IS its eventId — see lib/types.ts). Threshold is the number of referred
// sign-ups required, matching seed-demo.ts's "signup" mode.
const SEED_REWARDS: Record<string, { rewardLabel: string; threshold: number }> =
  {
    "AI Vibe Hackathon #4": {
      rewardLabel: "Hackathon Swag Bag",
      threshold: 2,
    },
    "Data & Analytics Meetup #27": {
      rewardLabel: "Free BARC Report",
      threshold: 1,
    },
  };

// Real, regional events. Dates are in CEST (+02:00) for the summer months.
// Events that seed-demo.ts already owns (with reward rules + registrations) are
// intentionally NOT included here — "AI Week Mainfranken 2026", "Startup Night
// Schweinfurt", and "DevOps Meetup Würzburg" live in seed-demo.ts only.
const seedData: SeedEvent[] = [
  makeEvent({
    title: "AI Vibe Hackathon #4",
    description:
      "Two days of AI prototyping as the finale of AI Week Mainfranken. Build real solutions with modern AI tools — free, collaborative, with challenges from IT-Verband Mainfranken.",
    startsAt: new Date("2026-07-18T09:00:00+02:00"),
    location: "ZDI Idea Lab, Veitshöchheimer Str. 7, 97080 Würzburg",
    tags: ["AI", "Hackathon"],
    coverImage:
      "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "Data & Analytics Meetup #27",
    description:
      "From AI Hype to Business Impact: what companies in Mainfranken really need to do. Part of AI Week Mainfranken.",
    startsAt: new Date("2026-07-20T18:00:00+02:00"),
    location: "Cube am Hubland, Würzburg",
    tags: ["AI", "IT"],
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "Transforming Media 2026",
    description:
      "Students from THWS Faculty of Computer Science present projects on media transformation, supported by Mediennetzwerk Bayern.",
    startsAt: new Date("2026-07-02T12:00:00+02:00"),
    location: "Vogel Convention Center, Würzburg",
    tags: ["IT", "Design"],
    coverImage:
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "Summer Expo 2026 — HCI & Games Engineering",
    description:
      "Presentations on computer science, games engineering, HCI, and psychology of interactive systems. See student projects and prototypes.",
    startsAt: new Date("2026-07-17T10:00:00+02:00"),
    location: "JMU Campus, Würzburg",
    tags: ["IT", "Design"],
    coverImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "Würzburg Business Meetup",
    description:
      "Monthly networking for founders, freelancers, and business professionals in Würzburg.",
    startsAt: new Date("2026-08-05T18:00:00+02:00"),
    location: "Location TBA, Würzburg",
    tags: ["Startup", "Networking"],
    coverImage:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "lernOS Convention 2026",
    description:
      "Open learning and knowledge management convention. Hands-on sessions on personal knowledge mastery and collaborative learning.",
    startsAt: new Date("2026-07-15T09:00:00+02:00"),
    location: "Satellit nomad, Würzburg",
    tags: ["Community", "Workshop"],
    coverImage:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "IT-Verband Get in Touch — Schweinfurt",
    description:
      "Meet the IT-Verband Mainfranken over pizza and drinks. Impulse talks on agile leadership and innovation management.",
    startsAt: new Date("2026-07-22T18:00:00+02:00"),
    location: "StudyFAB, Schweinfurt",
    tags: ["IT", "Networking"],
    coverImage:
      "https://images.unsplash.com/photo-1558008258-3256797b43f3?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "GEO Strategy Workshop — AI Week",
    description:
      "Strategies for the era of Generative Engine Optimization. Hosted by IT-Verband Mainfranken Community of Practice.",
    startsAt: new Date("2026-07-25T14:00:00+02:00"),
    location: "rockenstein AG, Würzburg",
    tags: ["AI", "Workshop"],
    coverImage:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop",
  }),
  makeEvent({
    title: "Franconian Data Science Day",
    description:
      "Full-day conference on data science applications in Franconian industry. Academic and practitioner talks.",
    startsAt: new Date("2026-09-10T09:30:00+02:00"),
    location: "FHWS, Würzburg",
    tags: ["AI", "IT"],
    coverImage:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop",
  }),
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local before running."
    );
  }

  const eventsCol = await events();
  const rewardRulesCol = await rewardRules();

  // Scoped, idempotent cleanup — only this seed's events (and the old generic
  // seed's). Never deletes seed-demo.ts data (owned by Lisa's hashed id).
  const { deletedCount } = await eventsCol.deleteMany({
    organizerId: { $in: [ORGANIZER_ID, LEGACY_ORGANIZER_ID] },
  });
  console.log(
    `Deleted ${deletedCount} existing catalog event(s) (organizerId in "${ORGANIZER_ID}", "${LEGACY_ORGANIZER_ID}").`
  );

  // Idempotent cleanup of this seed's reward rules. Event _ids are regenerated
  // each run, so match on the stable reward labels to avoid orphaning old rules.
  // Scoped to SEED_REWARDS labels only — never touches seed-demo.ts's rules.
  const seedRewardLabels = Object.values(SEED_REWARDS).map((r) => r.rewardLabel);
  const delRewards = await rewardRulesCol.deleteMany({
    rewardLabel: { $in: seedRewardLabels },
  });
  console.log(
    `Deleted ${delRewards.deletedCount} existing seed reward rule(s).`
  );

  await eventsCol.insertMany(seedData as unknown as Event[]);

  for (const event of seedData) {
    console.log(`Inserted: ${event.title}`);
  }

  // Attach reward rules to their events by title → _id. A RewardRule's _id is
  // its eventId, so we read it off the just-inserted seed docs.
  const rewardRuleDocs: RewardRule[] = seedData
    .filter((event) => SEED_REWARDS[event.title])
    .map((event) => ({
      _id: event._id,
      mode: "signup", // "N referrals" == N referred sign-ups
      threshold: SEED_REWARDS[event.title].threshold,
      rewardLabel: SEED_REWARDS[event.title].rewardLabel,
    }));

  if (rewardRuleDocs.length > 0) {
    await rewardRulesCol.insertMany(rewardRuleDocs as unknown as RewardRule[]);
    for (const rule of rewardRuleDocs) {
      console.log(
        `Reward rule: ${rule.rewardLabel} (${rule.threshold} ${rule.mode} referrals)`
      );
    }
  }

  console.log(
    `\nSeeded ${seedData.length} real region events and ${rewardRuleDocs.length} reward rules.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
