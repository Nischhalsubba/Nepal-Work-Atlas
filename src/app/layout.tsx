import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepal Work Atlas",
  description: "Evidence-first labor-market intelligence for Nepal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            'Inter, "Noto Sans Devanagari", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
