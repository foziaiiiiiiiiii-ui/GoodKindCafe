import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Goodkind Coffee — New York", template: "%s — Goodkind Coffee" },
  description: "Coffee, pastries, and the Goodkind menu at 18 Orchard Street, New York.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
