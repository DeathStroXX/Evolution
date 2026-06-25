import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-base font-bold text-white">
            Mainfranken Community Connect
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Discover and connect with community events in Mainfranken.
          </p>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="https://discord.gg/yTF5KK3QpQ"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-300 transition-colors hover:text-primary"
          >
            Discord
          </Link>
          <Link
            href="https://www.linkedin.com/groups/11808070"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-300 transition-colors hover:text-primary"
          >
            LinkedIn
          </Link>
        </nav>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-neutral-500 sm:px-6 lg:px-8">
          © 2026 Mainfranken Community Connect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
