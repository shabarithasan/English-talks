import { enterpriseHighlights } from "../../lib/site-content";
import { PageHero } from "../../components/page-hero";

export default function BusinessPage() {
  return (
    <>
      <PageHero
        eyebrow="For Business"
        title="English assessment and coaching for distributed teams"
        description="Support hiring, internal mobility, and communication training with placement tests, speaking analytics, and AI-driven practice paths."
        ctaLabel="Request Demo"
        bullets={[
          "Role-based placement tests for hiring and promotion workflows",
          "Manager dashboards with cohort trends and reporting exports",
          "API-ready architecture for HRIS, LMS, and enterprise identity",
        ]}
      />
      <section className="feature-grid">
        {enterpriseHighlights.map((item) => (
          <article key={item} className="panel route-card">
            <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>{item}</h3>
            <p className="muted" style={{ marginBottom: 0 }}>
              Designed for secure org-level reporting, delegated admin controls, and scalable seat
              management across multiple learner groups.
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
