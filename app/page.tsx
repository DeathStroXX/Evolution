import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ActivityTicker from "@/components/ActivityTicker";
import { T } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "AI-powered discovery",
    description:
      "We extract and organize event details automatically, so the region's tech events are always easy to find in one place.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3a6 6 0 0 0-6 6c0 2 1 3 1 5h10c0-2 1-3 1-5a6 6 0 0 0-6-6z" />
        <line x1="9" y1="18" x2="15" y2="18" />
        <line x1="10" y1="21" x2="14" y2="21" />
      </svg>
    ),
  },
  {
    title: "Referral rewards",
    description:
      "Share events with your network through personal referral links and earn points every time a friend registers and checks in.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    title: "Community connection",
    description:
      "Register, check in, and meet the people building Mainfranken's tech scene — from startups and meetups to workshops and conferences.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-secondary/60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium text-foreground/80">
              <span className="h-2 w-2 rounded-full bg-primary" />
              IT-Verband Mainfranken
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              <T k="home.hero.title" />
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              <T k="home.hero.subtitle" />
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/events">
                  <T k="home.hero.cta" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth">{<T k="auth.title" />}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Live activity */}
        <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:px-8">
          <ActivityTicker />
        </div>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block h-1.5 w-12 rounded-full bg-primary" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything for the Mainfranken tech scene
            </h2>
            <p className="mt-3 text-muted-foreground">
              One platform to discover events, grow your network, and get
              rewarded for bringing people together.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="h-full border-border transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    {feature.icon}
                  </span>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-secondary/60">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to connect?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Browse upcoming events across the region and reserve your spot in
              seconds.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/events">
                <T k="home.hero.cta" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
