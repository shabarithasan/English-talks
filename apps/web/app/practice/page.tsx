const transcriptLines = [
  { speaker: "AI Coach", text: "Tell me about a recent challenge you solved at work." },
  { speaker: "Live Transcript", text: "I needed to explain a delay to a client, so I clarified the cause and proposed new milestones..." },
  { speaker: "Hint", text: "Try adding one concrete example and a stronger closing sentence." },
];

export default function PracticePage() {
  return (
    <>
      <section className="panel section-space hero-grid">
        <div className="stack-md">
          <span className="pill">Real-time practice preview</span>
          <h1 className="headline">Streaming transcript and coaching UI</h1>
          <p className="muted" style={{ margin: 0 }}>
            This route sketches the user-facing experience for WebSocket-powered speaking sessions:
            microphone capture, partial transcript updates, and instant coaching hints.
          </p>
        </div>
        <div className="panel section-space stack-sm">
          <strong>Session controls</strong>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button className="button-primary" type="button">
              Start recording
            </button>
            <button className="button-secondary" type="button">
              End session
            </button>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        {transcriptLines.map((entry) => (
          <article key={entry.speaker} className="panel route-card stack-sm" aria-live="polite">
            <span className="pill">{entry.speaker}</span>
            <p style={{ margin: 0 }}>{entry.text}</p>
          </article>
        ))}
      </section>
    </>
  );
}

