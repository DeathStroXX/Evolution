"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "de";

// German by default — the primary audience is German. Users can toggle to EN.
const DEFAULT_LOCALE: Locale = "de";
const STORAGE_KEY = "locale";

// All translatable UI strings. Content (event titles/descriptions, tier names,
// dashboard internals) is intentionally NOT here — only chrome/UI copy.
type Entry = { en: string; de: string };

export const TRANSLATIONS: Record<string, Entry> = {
  "nav.events": { en: "Events", de: "Veranstaltungen" },
  "nav.dashboard": { en: "Dashboard", de: "Dashboard" },
  "nav.myPoints": { en: "My Points", de: "Meine Punkte" },
  "nav.join": { en: "Join", de: "Beitreten" },
  "nav.signOut": { en: "Sign out", de: "Abmelden" },

  "events.title": {
    en: "IT-Events in der Region",
    de: "IT-Events in der Region",
  },
  "events.subtitle": {
    en: "Discover meetups, workshops, and gatherings across the Mainfranken tech community.",
    de: "Entdecke Meetups, Workshops und Events der Mainfranken Tech-Community.",
  },
  "events.allFilter": { en: "All", de: "Alle" },
  "events.going": { en: "going", de: "dabei" },
  "events.registered": { en: "Registered", de: "Registriert" },

  "event.when": { en: "WHEN", de: "WANN" },
  "event.where": { en: "WHERE", de: "WO" },
  "event.register": { en: "Register", de: "Registrieren" },
  "event.leaderboard": {
    en: "View referral leaderboard",
    de: "Empfehlungs-Rangliste anzeigen",
  },
  "event.reward.title": {
    en: "What you can earn",
    de: "Was du gewinnen kannst",
  },
  "event.reward.refer": {
    en: "Refer {n} friends who attend",
    de: "Empfehle {n} Freunde, die teilnehmen",
  },
  "event.reward.redeemNote": {
    en: "Reward can be redeemed after the event — verified by check-in",
    de: "Belohnung nach dem Event einlösbar — bestätigt per Check-in",
  },
  "event.reward.unlocked": {
    en: "Reward unlocked",
    de: "Belohnung freigeschaltet",
  },
  "event.reward.toGo": { en: "to go", de: "noch" },
  "event.reward.referrals": { en: "referrals", de: "Empfehlungen" },

  "share.title": {
    en: "Share & earn points",
    de: "Teilen & Punkte sammeln",
  },
  "share.subtitle": {
    en: "Invite friends with your personal link. You earn points when they register and check in.",
    de: "Lade Freunde mit deinem persönlichen Link ein. Du bekommst Punkte, wenn sie sich anmelden und einchecken.",
  },
  "share.copyLink": { en: "Copy link", de: "Link kopieren" },
  "share.copied": { en: "Copied!", de: "Kopiert!" },
  "share.progress": {
    en: "{n}/{total} referrals — earn a {reward}",
    de: "{n}/{total} Empfehlungen — gewinne: {reward}",
  },

  "points.title": { en: "Your points", de: "Deine Punkte" },
  "points.subtitle": {
    en: "Level up by sharing events and bringing the community together.",
    de: "Steige auf, indem du Events teilst und die Community zusammenbringst.",
  },
  "points.currentTier": { en: "Current tier", de: "Aktuelle Stufe" },
  "points.totalPoints": { en: "Total points", de: "Gesamtpunkte" },
  "points.pointsTo": { en: "points to", de: "Punkte bis" },
  "points.achievements": { en: "Achievements", de: "Erfolge" },
  "points.badgesUnlocked": {
    en: "{n} of {total} badges unlocked",
    de: "{n} von {total} Abzeichen freigeschaltet",
  },
  "points.impact": {
    en: "Your referral impact",
    de: "Dein Empfehlungs-Einfluss",
  },
  "points.impactSubtitle": {
    en: "The ripple effect of the events you've shared.",
    de: "Der Welleneffekt deiner geteilten Events.",
  },
  "points.brought": {
    en: "You've brought {n} people to events.",
    de: "Du hast {n} Personen zu Events gebracht.",
  },
  "points.shares": { en: "Shares", de: "Geteilt" },
  "points.signups": { en: "Sign-ups driven", de: "Anmeldungen" },
  "points.checkins": { en: "Check-ins driven", de: "Check-ins" },
  "points.byEvent": { en: "By event", de: "Nach Event" },
  "points.noReward": {
    en: "No reward set for this event yet.",
    de: "Noch keine Belohnung für dieses Event.",
  },

  "auth.title": { en: "Join or sign in", de: "Beitreten oder anmelden" },
  "auth.subtitle": {
    en: "No password needed — just your name and email",
    de: "Kein Passwort nötig — nur Name und E-Mail",
  },
  "auth.continue": { en: "Continue", de: "Weiter" },
  "auth.signInToContinue": {
    en: "Sign in to continue",
    de: "Melde dich an, um fortzufahren",
  },
  "auth.invited": {
    en: "You were invited! Sign in to claim your spot.",
    de: "Du wurdest eingeladen! Melde dich an.",
  },

  "ticker.live": { en: "LIVE", de: "LIVE" },

  "dashboard.title": { en: "My Events", de: "Meine Events" },
  "dashboard.subtitle": {
    en: "Manage your events and track turnout.",
    de: "Verwalte deine Events und verfolge die Teilnahme.",
  },
  "dashboard.createEvent": { en: "Create Event", de: "Event erstellen" },
  "dashboard.noEvents": { en: "No events yet", de: "Noch keine Events" },
  "dashboard.createFirst": {
    en: "Create your first event to start tracking turnout.",
    de: "Erstelle dein erstes Event.",
  },

  "leaderboard.title": {
    en: "Referral leaderboard",
    de: "Empfehlungs-Rangliste",
  },
  "leaderboard.subtitle": {
    en: "Top members bringing people to {event}",
    de: "Top-Mitglieder, die Leute zu {event} bringen",
  },

  "home.hero.title": {
    en: "Discover tech events. Grow the community.",
    de: "Entdecke Tech-Events. Stärke die Community.",
  },
  "home.hero.subtitle": {
    en: "Find, share, and connect with the local tech community across the Mainfranken region.",
    de: "Finde, teile und vernetze dich mit der Tech-Community in Mainfranken.",
  },
  "home.hero.cta": { en: "Explore events", de: "Events entdecken" },

  "badge.firstShare": { en: "First Share", de: "Erstes Teilen" },
  "badge.connector": { en: "Connector", de: "Vernetzer" },
  "badge.crowdPuller": { en: "Crowd Puller", de: "Publikumsmagnet" },
  "badge.champion": { en: "Community Champion", de: "Community-Champion" },

  "footer.tagline": {
    en: "Find, share, and connect with the local tech community across the Mainfranken region.",
    de: "Finde, teile und vernetze dich mit der Tech-Community in Mainfranken.",
  },
};

type Params = Record<string, string | number>;

/** Replace {token} placeholders with values from params. */
function interpolate(str: string, params?: Params): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) =>
    key in params ? String(params[key]) : `{${key}}`
  );
}

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start from the default on both server and first client render so SSR and
  // hydration match; read the stored preference in an effect afterwards.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "de") setLocaleState(stored);
    } catch {
      // localStorage unavailable — keep the default.
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore write failures (private mode, etc.).
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Params) => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key; // Surface the key itself if a string is missing.
      return interpolate(entry[locale], params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

/**
 * Tiny translation component usable inside SERVER components (which can't call
 * the useLanguage hook). Renders the translated string for `k`, interpolating
 * `p`. Being a client component, it re-renders when the locale changes.
 */
export function T({ k, p }: { k: string; p?: Params }) {
  const { t } = useLanguage();
  return <>{t(k, p)}</>;
}
