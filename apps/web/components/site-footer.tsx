import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/business", label: "For Business" },
  { href: "/schools", label: "For Schools" },
  { href: "/leveltest", label: "Level Test" },
  { href: "/ielts-writing", label: "IELTS Writing" },
];

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="page-shell">
        <div className="panel section-space stack-md">
          <div className="hero-grid">
            <div className="stack-sm">
              <strong>Speak more. Measure better. Improve daily.</strong>
              <p className="muted" style={{ margin: 0 }}>
                This starter combines a high-conversion marketing site with a learner platform, API
                starter, data model, and implementation docs for a full rebuild.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
