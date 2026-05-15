import Link from "next/link";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  bullets: string[];
};

export function PageHero({ eyebrow, title, description, ctaLabel, bullets }: PageHeroProps) {
  return (
    <section className="panel section-space hero-grid">
      <div className="stack-lg">
        <span className="pill">{eyebrow}</span>
        <div className="stack-md">
          <h1 className="headline">{title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: "1.05rem" }}>
            {description}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link className="button-primary" href="/dashboard">
            {ctaLabel}
          </Link>
          <Link className="button-secondary" href="/practice">
            Preview Practice Flow
          </Link>
        </div>
      </div>
      <div className="panel hero-art">
        <div className="hero-orbit">
          <div className="stat-badge top">
            <strong>Real-time feedback</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0" }}>
              transcript + hints
            </p>
          </div>
          <div style={{ width: 180, height: 180, borderRadius: 999, background: "rgba(15, 118, 110, 0.95)" }} />
          <div className="stat-badge bottom">
            <strong>Adaptive practice</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0" }}>
              goals, level, and streaks
            </p>
          </div>
        </div>
      </div>
      <div style={{ gridColumn: "1 / -1" }} className="feature-grid">
        {bullets.map((bullet) => (
          <div key={bullet} className="panel route-card">
            <p style={{ margin: 0 }}>{bullet}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

