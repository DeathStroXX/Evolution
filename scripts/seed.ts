import { randomUUID } from "crypto";
import { events } from "@/lib/collections";
import type { Event } from "@/lib/types";

const ORGANIZER_ID = "demo-organizer";

// Realistic Mainfranken / Würzburg tech events spread across the next ~6 months.
// imageUrl is intentionally null — the UI renders a green gradient placeholder.
type SeedEvent = Omit<Event, "imageUrl"> & { imageUrl: null };

function makeEvent(
  data: Omit<SeedEvent, "_id" | "organizerId" | "createdAt" | "imageUrl">
): SeedEvent {
  return {
    _id: randomUUID(),
    organizerId: ORGANIZER_ID,
    imageUrl: null,
    createdAt: new Date(),
    ...data,
  };
}

const seedData: SeedEvent[] = [
  makeEvent({
    title: "AI Vibe Hackathon #4",
    description:
      "Two days of rapid AI prototyping at the ZDI Idea Lab. Teams form on the spot, build with the latest LLM tooling, and pitch working demos to a jury of regional founders and engineers. Beginners and seasoned hackers are equally welcome.",
    startsAt: new Date("2026-06-25T09:00:00+02:00"),
    location: "ZDI Idea Lab, Veitshöchheimer Str. 7, 97080 Würzburg",
    tags: ["AI", "Hackathon"],
  }),
  makeEvent({
    title: "AI Week Mainfranken 2026",
    description:
      "A region-wide week of talks, demos, and meetups exploring how artificial intelligence is reshaping Mainfranken's industry and public life. Sessions run across multiple venues in Würzburg and Schweinfurt with a shared community track.",
    startsAt: new Date("2026-06-22T10:00:00+02:00"),
    location: "Various venues, Würzburg & Schweinfurt",
    tags: ["AI", "Community"],
  }),
  makeEvent({
    title: "Würzburg Web Week",
    description:
      "The region's gathering for web developers, designers, and digital agencies. Expect hands-on sessions on modern frontend frameworks, accessibility, and shipping production web apps, plus plenty of hallway-track networking.",
    startsAt: new Date("2026-07-08T09:30:00+02:00"),
    location: "TGZ Würzburg, Friedrich-Bergius-Ring 15, 97076 Würzburg",
    tags: ["IT", "Community"],
  }),
  makeEvent({
    title: "Mainfranken Tech Meetup",
    description:
      "A relaxed monthly meetup for developers and IT professionals across Mainfranken. Two short talks followed by open networking over drinks at the Posthalle. A great entry point if you're new to the local tech scene.",
    startsAt: new Date("2026-07-16T18:30:00+02:00"),
    location: "Posthalle Würzburg, Bahnhofsplatz 2a, 97070 Würzburg",
    tags: ["IT", "Networking"],
  }),
  makeEvent({
    title: "StartupFranken Pitch Night",
    description:
      "Early-stage founders from the region pitch their ventures to investors, mentors, and the local startup community. Hosted at the IGZ, the evening closes with informal networking and feedback rounds.",
    startsAt: new Date("2026-07-23T19:00:00+02:00"),
    location: "IGZ Würzburg, Friedrich-Bergius-Ring 15, 97076 Würzburg",
    tags: ["Startup", "Networking"],
  }),
  makeEvent({
    title: "AI in Healthcare Workshop",
    description:
      "A practical workshop at the University of Würzburg on applying machine learning to clinical data and medical imaging. Researchers and practitioners walk through real case studies and discuss regulatory and ethical considerations.",
    startsAt: new Date("2026-08-06T14:00:00+02:00"),
    location: "Universität Würzburg, Sanderring 2, 97070 Würzburg",
    tags: ["AI", "Workshop"],
  }),
  makeEvent({
    title: "DevOps Mainfranken",
    description:
      "A hands-on day for engineers running cloud and on-prem infrastructure. Sessions cover CI/CD pipelines, Kubernetes in production, and observability, with live demos at the Vogel Convention Center.",
    startsAt: new Date("2026-08-20T09:00:00+02:00"),
    location: "Vogel Convention Center, Max-Planck-Str. 7/9, 97082 Würzburg",
    tags: ["IT", "Workshop"],
  }),
  makeEvent({
    title: "Franconian Data Science Day",
    description:
      "A full-day conference at the FHWS bringing together data scientists, analysts, and engineers from across Franconia. Talks span practical ML pipelines, data engineering, and the responsible use of analytics in industry.",
    startsAt: new Date("2026-09-10T09:30:00+02:00"),
    location: "FHWS, Sanderheinrichsleitenweg 20, 97074 Würzburg",
    tags: ["AI", "IT"],
  }),
  makeEvent({
    title: "UX Design Sprint Würzburg",
    description:
      "An intensive sprint where designers and product people tackle a real-world brief over a single day. Facilitated sessions on research, prototyping, and usability testing, hosted in a relaxed coworking setting.",
    startsAt: new Date("2026-09-24T10:00:00+02:00"),
    location: "Coworking Würzburg, Münzstr. 1, 97070 Würzburg",
    tags: ["Design", "Workshop"],
  }),
  makeEvent({
    title: "Robotics & AI Demo Day",
    description:
      "Local labs, startups, and student teams show off robotics and embodied-AI projects at the ZDI Idea Lab. An open, family-friendly afternoon of live demos, hands-on stations, and conversations with the builders.",
    startsAt: new Date("2026-10-08T13:00:00+02:00"),
    location: "ZDI Idea Lab, Veitshöchheimer Str. 7, 97080 Würzburg",
    tags: ["AI", "Community"],
  }),
  makeEvent({
    title: "Gründerland Bayern Meetup Würzburg",
    description:
      "Part of the Gründerland Bayern initiative, this meetup at the IHK connects founders with funding programs, mentors, and peers. Short impulse talks are followed by structured networking for the regional startup ecosystem.",
    startsAt: new Date("2026-10-22T18:00:00+02:00"),
    location: "IHK Würzburg-Schweinfurt, Mainaustr. 33, 97082 Würzburg",
    tags: ["Startup", "Networking"],
  }),
  makeEvent({
    title: "IT Security Day Mainfranken",
    description:
      "A focused day on cybersecurity for the region's businesses and IT teams. Sessions cover threat modeling, incident response, and securing modern cloud workloads, with a vendor-neutral practitioner perspective.",
    startsAt: new Date("2026-11-05T09:00:00+01:00"),
    location: "Vogel Convention Center, Max-Planck-Str. 7/9, 97082 Würzburg",
    tags: ["IT", "Workshop"],
  }),
  makeEvent({
    title: "AI Barcamp Mainfranken",
    description:
      "An unconference where the agenda is set by the participants on the morning of the event. Expect open, peer-led sessions on everything from prompt engineering to MLOps, all at the ZDI Idea Lab.",
    startsAt: new Date("2026-11-21T09:30:00+01:00"),
    location: "ZDI Idea Lab, Veitshöchheimer Str. 7, 97080 Würzburg",
    tags: ["AI", "Community"],
  }),
  makeEvent({
    title: "Hackathon for Good Würzburg",
    description:
      "A weekend hackathon at the FHWS where teams build tech for nonprofits and social causes in the region. Mentors from local companies support each team, and the best projects receive support to continue beyond the event.",
    startsAt: new Date("2026-12-05T09:00:00+01:00"),
    location: "FHWS, Sanderheinrichsleitenweg 20, 97074 Würzburg",
    tags: ["IT", "Hackathon"],
  }),
  makeEvent({
    title: "Mainfranken Digital New Year",
    description:
      "Kick off the year with the regional digital community at the Posthalle. A celebratory evening of lightning talks, a look ahead at the year's tech events, and relaxed networking with founders, developers, and creatives.",
    startsAt: new Date("2027-01-15T18:30:00+01:00"),
    location: "Posthalle Würzburg, Bahnhofsplatz 2a, 97070 Würzburg",
    tags: ["IT", "Community", "Networking"],
  }),
];

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local before running."
    );
  }

  const eventsCol = await events();

  const { deletedCount } = await eventsCol.deleteMany({});
  console.log(`Deleted ${deletedCount} existing event(s).`);

  await eventsCol.insertMany(seedData as unknown as Event[]);

  for (const event of seedData) {
    console.log(`Inserted: ${event.title}`);
  }

  console.log(`\nSeeded ${seedData.length} events.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
