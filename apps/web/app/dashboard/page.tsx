import { dashboardMetrics } from "../../lib/site-content";
import Link from "next/link";

const recommendations = [
  "Retake a 3-minute fluency drill with follow-up prompts.",
  "Review grammar notes from your most recent interview session.",
  "Complete today’s vocabulary booster before your streak expires.",
];

export default function DashboardPage() {
  return (
    <>
      <section className="panel section-space stack-md">
        <span className="pill">Learner App Shell</span>
        <div className="hero-grid">
          <div className="stack-sm">
            <h1 className="headline">Welcome back, Nina.</h1>
            <p className="muted" style={{ margin: 0 }}>
              This dashboard preview represents the authenticated experience where sessions, scores,
              subscriptions, recommendations, and certificates will live.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="button-primary" href="/practice">
              Start practice
            </Link>
            <Link className="button-secondary" href="/results">
              View latest results
            </Link>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className="panel route-card stack-sm">
            <span className="muted">{metric.label}</span>
            <strong style={{ fontSize: "1.8rem" }}>{metric.value}</strong>
            <span style={{ color: "var(--teal-dark)" }}>{metric.trend}</span>
          </article>
        ))}
      </section>

      <section className="feature-grid">
        <article className="panel section-space stack-sm">
          <span className="pill">Recommended next</span>
          {recommendations.map((item) => (
            <div key={item} className="panel route-card">
              <p style={{ margin: 0 }}>{item}</p>
            </div>
          ))}
        </article>

        <article className="panel section-space stack-sm">
          <span className="pill">Upcoming milestones</span>
          <div className="panel route-card stack-sm">
            <strong>Level test refresh</strong>
            <p className="muted" style={{ margin: 0 }}>
              Available after 4 more guided sessions.
            </p>
          </div>
          <div className="panel route-card stack-sm">
            <strong>Certificate eligibility</strong>
            <p className="muted" style={{ margin: 0 }}>
              Complete the Business English track checkpoint to unlock.
            </p>
          </div>
        </article>
      </section>
    </>
  );
}
