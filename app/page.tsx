import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Mainfranken Community Connect
      </h1>
      <Link
        href="/events"
        className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Browse events
      </Link>
    </main>
  );
}
