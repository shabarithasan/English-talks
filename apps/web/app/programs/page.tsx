import { courseTracks } from "../../lib/site-content";
import Link from "next/link";

export default function ProgramsPage() {
  return (
    <>
      <section className="panel section-space stack-md">
        <span className="pill">Programs</span>
        <h1 className="headline">Structured learning tracks for conversation, work, and exams</h1>
        <p className="muted" style={{ margin: 0 }}>
          These routes give the marketing site a place to sell guided programs while the app
          delivers daily lessons, progress data, and adaptive follow-ups.
        </p>
      </section>

      <section className="card-grid">
        {courseTracks.map((track) => (
          <article key={track.title} className="panel route-card stack-sm">
            <span className="pill">{track.targetLevel}</span>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{track.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{track.focus}</p>
            <p className="muted" style={{ margin: 0 }}>Suggested pace: {track.pace}</p>
            <Link className="button-primary" href="/dashboard">
              Enroll Flow Preview
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
