import { dashboardMetrics } from "../lib/site-content";

export function DashboardPreview() {
  return (
    <section className="panel section-space stack-md">
      <div className="stack-sm">
        <span className="pill">Learner Dashboard</span>
        <h2 className="headline" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
          A product shell for progress, recommendations, and practice history
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          The starter includes an app dashboard route and the API contracts needed to power level
          reports, streaks, adaptive lessons, and speaking history.
        </p>
      </div>
      <div className="metric-grid">
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className="panel route-card stack-sm">
            <span className="muted">{metric.label}</span>
            <strong style={{ fontSize: "1.6rem" }}>{metric.value}</strong>
            <span style={{ color: "var(--teal-dark)" }}>{metric.trend}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
