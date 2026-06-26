import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { PointsToast } from "@/components/PointsToast";
import { Confetti } from "@/components/Confetti";

export const metadata: Metadata = {
  title: "Mainfranken Community Connect",
  description:
    "Discover, share, and connect with tech events across the Mainfranken region.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          {children}
          <PointsToast />
          <Confetti />
        </LanguageProvider>
      </body>
    </html>
  );
}
