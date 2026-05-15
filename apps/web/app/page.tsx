import Link from "next/link";
import { ArrowRight, AudioLines, BriefcaseBusiness, GraduationCap, Sparkles } from "lucide-react";
import { courseTracks, enterpriseHighlights } from "../lib/site-content";
import { DashboardPreview } from "../components/dashboard-preview";
import { ProductCardGrid } from "../components/product-card-grid";

export default function HomePage() {
  return (
    <>
      <section className="panel section-space hero-grid">
        <div className="stack-lg">
          <span className="pill">2.5M+ learners inspired product direction</span>
          <div className="stack-md">
            <h1 className="display">AI speaking practice that feels like a coach, not a form.</h1>
            <p className="muted" style={{ margin: 0, fontSize: "1.08rem", maxWidth: 640 }}>
              This starter rebuilds the English Talks concept as a modern platform: high-converting
              marketing pages, a responsive learner app, and an API layer designed for assessments,
              real-time coaching, enterprise reporting, and subscription growth.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <Link className="button-primary" href="/dashboard">
              Launch learner app <ArrowRight size={18} />
            </Link>
            <Link className="button-secondary" href="/docs">
              View architecture notes
            </Link>
          </div>
        </div>
        <div className="panel hero-art">
          <div className="hero-orbit">
            <div className="stat-badge top">
              <strong>Instant CEFR</strong>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                placement + next steps
              </p>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              <div className="pill">
                <AudioLines size={16} /> Live transcription
              </div>
              <div className="pill">
                <BriefcaseBusiness size={16} /> Interview practice
              </div>
              <div className="pill">
                <GraduationCap size={16} /> Course pathways
              </div>
            </div>
            <div className="stat-badge bottom">
              <strong>Daily streak loops</strong>
              <p className="muted" style={{ margin: "0.25rem 0 0" }}>
                lessons, quizzes, shadowing
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stack-md">
        <div className="stack-sm">
          <span className="pill">Products</span>
          <h2 className="headline" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)" }}>
            Public routes mapped from the existing product surface
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Each core product area from the brief is scaffolded as a preserved route that can be
            expanded without breaking marketing SEO structure.
          </p>
        </div>
        <ProductCardGrid />
      </section>

      <DashboardPreview />

      <section className="feature-grid">
        <article className="panel section-space stack-sm">
          <span className="pill">Programs</span>
          <h3 style={{ fontSize: "1.4rem", margin: 0 }}>Learning tracks</h3>
          {courseTracks.map((track) => (
            <div key={track.title} className="route-card panel stack-sm">
              <strong>{track.title}</strong>
              <span className="muted">
                {track.targetLevel} · {track.pace}
              </span>
              <p className="muted" style={{ margin: 0 }}>
                {track.focus}
              </p>
            </div>
          ))}
        </article>

        <article className="panel section-space stack-sm">
          <span className="pill">Enterprise</span>
          <h3 style={{ fontSize: "1.4rem", margin: 0 }}>Business and school readiness</h3>
          {enterpriseHighlights.map((item) => (
            <div key={item} className="route-card panel">
              <p style={{ margin: 0 }}>{item}</p>
            </div>
          ))}
        </article>

        <article className="panel section-space stack-sm">
          <span className="pill">Roadmap</span>
          <h3 style={{ fontSize: "1.4rem", margin: 0 }}>Built for staged delivery</h3>
          <div className="route-card panel stack-sm">
            <strong>Phase 1</strong>
            <p className="muted" style={{ margin: 0 }}>
              Marketing site, learner shell, API starter, database schema, and handoff docs.
            </p>
          </div>
          <div className="route-card panel stack-sm">
            <strong>Phase 2</strong>
            <p className="muted" style={{ margin: 0 }}>
              Auth, audio upload, STT integration, AI scoring, progress persistence, and billing.
            </p>
          </div>
          <div className="route-card panel stack-sm">
            <strong>Phase 3</strong>
            <p className="muted" style={{ margin: 0 }}>
              Enterprise reporting, partner matching, mobile surfaces, and deeper analytics.
            </p>
          </div>
        </article>
      </section>

      <section className="panel section-space stack-md">
        <span className="pill">
          <Sparkles size={16} /> Experience direction
        </span>
        <div className="hero-grid">
          <div className="stack-sm">
            <h2 className="headline" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Real-time coaching, adaptive content, and learner momentum
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              The design system is intentionally bright and warm instead of generic SaaS chrome, and
              the codebase is structured so we can split marketing, app, and AI services cleanly as
              the product grows.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link href="/business" className="button-secondary">
              For Business
            </Link>
            <Link href="/schools" className="button-secondary">
              For Schools
            </Link>
            <Link href="/leveltest" className="button-primary">
              Free Level Test
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
