import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/ielts", label: "IELTS" },
  { href: "/vocabulary-booster", label: "Vocabulary" },
  { href: "/jobinterview", label: "Interviews" },
  { href: "/business", label: "Business" },
  { href: "/schools", label: "Schools" },
];

export function SiteHeader() {
  return (
    <header className="top-nav">
      <div className="page-shell">
        <div className="panel top-nav-inner">
          <Link href="/" style={{ display: "grid", gap: 2 }}>
            <strong style={{ fontSize: "1.05rem" }}>English Talks</strong>
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              AI speaking practice platform
            </span>
          </Link>
          <nav className="nav-links" aria-label="Primary navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap" }}>
            <Link className="button-secondary" href="/practice">
              Live Practice
            </Link>
            <Link className="button-primary" href="/dashboard">
              Open App
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
