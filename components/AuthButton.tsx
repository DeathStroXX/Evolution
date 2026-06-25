"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MeProfile {
  _id: string;
  name?: string;
  email?: string;
}

export default function AuthButton() {
  const [user, setUser] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

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
    // Re-check when the tab regains focus so the nav reflects a fresh login
    // (e.g. after the auth page redirects back here).
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
    };
  }, []);

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
        <Link href="/auth">Join</Link>
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
        My Points
      </Link>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
