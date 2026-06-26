"use client";

import { useLanguage, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: Locale[] = ["en", "de"];

/**
 * Compact "EN | DE" language switch for the header. The active locale is
 * highlighted with the lime accent.
 */
export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-border bg-white p-0.5 text-xs font-semibold"
    >
      {OPTIONS.map((option) => {
        const active = locale === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-1 uppercase tracking-wide transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
