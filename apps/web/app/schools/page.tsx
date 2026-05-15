import { PageHero } from "../../components/page-hero";

const schoolFeatures = [
  "Placement testing for incoming cohorts",
  "Teacher dashboards for class progress and error patterns",
  "Structured speaking programs with lesson completion tracking",
  "Future-ready LMS and SIS integration layer",
];

export default function SchoolsPage() {
  return (
    <>
      <PageHero
        eyebrow="For Schools"
        title="Placement, classroom practice, and measurable speaking growth"
        description="Give teachers a practical way to assess spoken English, assign AI-supported practice, and review progress at both student and class level."
        ctaLabel="Talk to Sales"
        bullets={schoolFeatures}
      />
      <section className="card-grid">
        {schoolFeatures.map((feature) => (
          <article key={feature} className="panel route-card stack-sm">
            <strong>{feature}</strong>
            <p className="muted" style={{ margin: 0 }}>
              The starter architecture includes the data model and API surfaces needed for school
              cohorts, placements, lesson progress, and certificate reporting.
            </p>
          </article>
        ))}
      </section>
    </>
  );
}

