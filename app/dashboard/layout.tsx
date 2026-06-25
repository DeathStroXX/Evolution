"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, PlusCircle, QrCode } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "My Events", icon: CalendarDays, exact: true },
  { href: "/dashboard/events/new", label: "Create Event", icon: PlusCircle },
  { href: "/dashboard/checkin", label: "Check-in Scanner", icon: QrCode },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-white">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="h-6 w-6 rounded-md bg-green-600" />
          <span className="text-sm font-semibold tracking-tight">
            Organizer
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          Mainfranken Community Connect
        </div>
      </aside>

      <main className="flex-1 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
