import Link from "next/link";
import { T } from "@/lib/i18n";

const footerLinks = [
  { href: "/events", label: "Events", external: false },
  { href: "/dashboard", label: "Dashboard", external: false },
  {
    href: "https://discord.gg/yTF5KK3QpQ",
    label: "Discord",
    external: true,
  },
  {
    href: "https://www.linkedin.com/groups/11808070",
    label: "LinkedIn",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                IT
              </span>
              <span className="text-base font-bold text-white">
                Mainfranken Community Connect
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400">
              <T k="footer.tagline" />
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-neutral-300 transition-colors hover:text-primary"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-neutral-300 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-neutral-500 sm:px-6 lg:px-8">
          © 2026 Mainfranken Community Connect. Built for the Mainfranken tech
          community.
        </div>
      </div>
    </footer>
  );
}
