const scoreCards = [
  { label: "Fluency", score: "7.5", note: "Responses are smooth, but transitions can be tighter." },
  { label: "Grammar", score: "6.5", note: "A few tense slips under pressure." },
  { label: "Vocabulary", score: "7.0", note: "Strong range, with room for sharper collocations." },
  { label: "Pronunciation", score: "7.0", note: "Clear overall with a few stressed-syllable misses." },
];

export default function ResultsPage() {
  return (
    <>
      <section className="panel section-space stack-md">
        <span className="pill">Assessment results</span>
        <h1 className="headline">Latest speaking report</h1>
        <p className="muted" style={{ margin: 0 }}>
          This route is the starting point for detailed results, downloadable reports, and future
          certificate issuance.
        </p>
      </section>

      <section className="card-grid">
        {scoreCards.map((card) => (
          <article key={card.label} className="panel route-card stack-sm">
            <span className="muted">{card.label}</span>
            <strong style={{ fontSize: "2rem" }}>{card.score}</strong>
            <p className="muted" style={{ margin: 0 }}>
              {card.note}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}

