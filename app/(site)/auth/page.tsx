"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function AuthForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/events";
  // Context cues only — these don't affect where login sends the user.
  const cameFromRedirect = Boolean(searchParams.get("redirect"));
  const wasInvited = Boolean(searchParams.get("ref"));

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !name.trim()) {
      setError("Please enter both your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <span className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-base font-black text-primary-foreground">
          IT
        </span>
        <CardTitle className="text-2xl">{t("auth.title")}</CardTitle>
        <CardDescription>{t("auth.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {cameFromRedirect && (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
            <p className="font-medium text-foreground">
              {t("auth.signInToContinue")}
            </p>
            {wasInvited && (
              <p className="mt-0.5 text-muted-foreground">
                {t("auth.invited")}
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="mt-1">
            {submitting ? `${t("auth.continue")}…` : t("auth.continue")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AuthPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
