"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSessions, markSessionReviewed, recordClientAnalytics } from "../../lib/api-client";
import type { LearnerSession } from "../../lib/learner-types";

export default function ResultsPage() {
  const [sessions, setSessions] = useState<LearnerSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const response = await getSessions();
        setSessions(response.sessions.filter((session) => session.rubric === "ielts"));
        setSelectedSessionId(response.sessions[0]?.id ?? null);
        await recordClientAnalytics([
          {
            eventName: "results.view",
            eventGroup: "engagement",
            path: "/results",
            properties: {
              sessionCount: response.sessions.length,
            },
          },
        ]);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Results could not be loaded");
      } finally {
        setLoading(false);
      }
    }

    void loadSessions();
  }, []);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null;

  async function handleReview(sessionId: string) {
    try {
      const updated = await markSessionReviewed(sessionId);
      setSessions((current) => current.map((session) => (session.id === updated.session.id ? updated.session : session)));
      setSelectedSessionId(updated.session.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update review status");
    }
  }

  if (loading) {
    return (
      <section className="panel section-space stack-md">
        <span className="pill">IELTS results</span>
        <h1 className="headline">Loading your saved speaking history…</h1>
      </section>
    );
  }

  return (
    <>
      <section className="panel section-space stack-md">
        <div className="hero-grid">
          <div className="stack-sm">
            <span className="pill">Assessment results</span>
            <h1 className="headline">Your IELTS speaking history</h1>
            <p className="muted" style={{ margin: 0 }}>
              Every uploaded speaking answer is now persisted with transcript, scoring metadata, and
              a downloadable report file.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="button-primary" href="/practice">
              Run another session
            </Link>
            <Link className="button-secondary" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>

      {selectedSession ? (
        <section className="feature-grid">
          <article className="panel section-space stack-md">
            <span className="pill">{selectedSession.promptTitle ?? "IELTS prompt"}</span>
            <h2 className="headline" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
              {selectedSession.assessment?.estimatedBandLabel ?? selectedSession.status}
            </h2>
            <div className="card-grid">
              {[
                { label: "Overall", value: selectedSession.assessment?.overallScore },
                { label: "Fluency", value: selectedSession.assessment?.fluencyScore },
                { label: "Grammar", value: selectedSession.assessment?.grammarScore },
                { label: "Vocabulary", value: selectedSession.assessment?.vocabularyScore },
                { label: "Pronunciation", value: selectedSession.assessment?.pronunciationScore },
              ].map((item) => (
                <div key={item.label} className="panel route-card stack-sm">
                  <span className="muted">{item.label}</span>
                  <strong style={{ fontSize: "1.7rem" }}>
                    {typeof item.value === "number" ? item.value.toFixed(1) : "—"}
                  </strong>
                </div>
              ))}
            </div>

            <div className="panel route-card stack-sm">
              <strong>Transcript</strong>
              <p style={{ margin: 0 }}>{selectedSession.transcript?.fullText ?? "Transcript unavailable."}</p>
            </div>

            <div className="panel route-card stack-sm">
              <strong>Next coaching steps</strong>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {(selectedSession.assessment?.nextSteps ?? []).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <button className="button-primary" type="button" onClick={() => handleReview(selectedSession.id)}>
                Mark reviewed
              </button>
              {selectedSession.reportUrl ? (
                <a className="button-secondary" href={selectedSession.reportUrl} target="_blank" rel="noreferrer">
                  Download report
                </a>
              ) : null}
            </div>
          </article>

          <article className="panel section-space stack-sm">
            <span className="pill">Saved sessions</span>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  className="panel route-card stack-sm"
                  style={{
                    textAlign: "left",
                    border: session.id === selectedSession.id ? "1px solid #3f6fff" : undefined,
                  }}
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  <strong>{session.promptTitle ?? "IELTS session"}</strong>
                  <span className="muted">
                    {session.assessment?.estimatedBandLabel ?? session.status} · {new Date(session.startedAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            ) : (
              <div className="panel route-card stack-sm">
                <strong>No IELTS sessions found</strong>
                <p className="muted" style={{ margin: 0 }}>
                  Upload your first IELTS answer from the practice page to start building history.
                </p>
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="panel section-space stack-md">
          <span className="pill">No saved reports yet</span>
          <p className="muted" style={{ margin: 0 }}>
            Start from the IELTS practice route to generate your first report and saved transcript.
          </p>
        </section>
      )}

      {error ? (
        <div className="panel route-card">
          <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
        </div>
      ) : null}
    </>
  );
}
