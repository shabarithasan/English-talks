import { marketingPages } from "@english-talks/shared";
import { notFound } from "next/navigation";
import { PageHero } from "../../components/page-hero";

export function generateStaticParams() {
  return marketingPages.map((page) => ({ slug: page.slug }));
}

export default function MarketingDetailPage({ params }: { params: { slug: string } }) {
  const page = marketingPages.find((entry) => entry.slug === params.slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.heroDescription}
        ctaLabel={page.ctaLabel}
        bullets={page.bullets}
      />
      <section className="panel section-space stack-md">
        <span className="pill">Why this route matters</span>
        <h2 className="headline" style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)" }}>
          {page.summary}
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          This route is scaffolded as a dedicated landing page so the marketing site can preserve
          SEO-friendly URLs while still pointing users into the authenticated product experience for
          full assessments, practice sessions, and subscriptions.
        </p>
      </section>
    </>
  );
}
