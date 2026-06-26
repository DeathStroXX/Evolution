"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface MeProfile {
  _id: string;
  name?: string;
  email?: string;
}

export default function AuthButton() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [user, setUser] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Re-check the session on every route change (deps: pathname). After login
  // the auth page calls router.push(), a client-side navigation that changes
  // the pathname — this re-runs the check so the nav immediately reflects the
  // new session without a manual refresh. The focus listener still covers the
  // case of returning to the tab from elsewhere.
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!cancelled) setUser(res.ok ? await res.json() : null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    check();
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
    };
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Reload regardless — the cookie is cleared server-side on success.
    }
    window.location.reload();
  }

  if (loading) {
    return <div className="h-9 w-16" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/auth">{t("nav.join")}</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-[10rem] truncate text-sm font-medium text-foreground">
        {user.name || user.email || "Member"}
      </span>
      <Link
        href="/me"
        className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
      >
        {t("nav.myPoints")}
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? "…" : t("nav.signOut")}
      </Button>
    </div>
  );
}
