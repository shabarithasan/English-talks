import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "English Talks",
  description: "AI English speaking practice, IELTS coaching, assessments, and learning paths.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable}`}
        style={{
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        <style>{`
          h1, h2, h3, h4, strong { font-family: var(--font-display), serif; }
        `}</style>
        <SiteHeader />
        <main className="page-shell" style={{ padding: "1rem 0 2rem" }}>
          <div className="site-grid">{children}</div>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
