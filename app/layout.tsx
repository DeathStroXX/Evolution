import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
