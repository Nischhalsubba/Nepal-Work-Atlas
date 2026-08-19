import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepal Work Atlas",
  description: "Evidence-first labor-market intelligence for Nepal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
