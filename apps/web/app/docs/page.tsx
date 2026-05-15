import Link from "next/link";

const docs = [
  {
    title: "Architecture",
    body: "System design, route strategy, services, and delivery guidance.",
    file: "/docs/architecture.md",
  },
  {
    title: "Backlog",
    body: "Prioritized milestones and implementation sequencing.",
    file: "/docs/backlog.md",
  },
  {
    title: "Developer handoff",
    body: "Repo setup, environment, API, migrations, monitoring, and release checklist.",
    file: "/docs/developer-handoff.md",
  },
];

export default function DocsPage() {
  return (
    <>
      <section className="panel section-space stack-md">
        <span className="pill">Project docs</span>
        <h1 className="headline">Implementation notes included in the repo</h1>
        <p className="muted" style={{ margin: 0 }}>
          The detailed planning material from your brief has been turned into repository docs for
          engineering handoff and staged delivery.
        </p>
      </section>
      <section className="card-grid">
        {docs.map((doc) => (
          <article key={doc.title} className="panel route-card stack-sm">
            <strong>{doc.title}</strong>
            <p className="muted" style={{ margin: 0 }}>{doc.body}</p>
            <Link className="button-secondary" href="/">
              See repo file: {doc.file}
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}

