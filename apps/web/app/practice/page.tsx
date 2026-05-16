"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  createPracticeSession,
  getCurrentUser,
  markSessionReviewed,
  recordClientAnalytics,
  uploadPracticeAudio,
} from "../../lib/api-client";
import type { LearnerSession, LearnerUser } from "../../lib/learner-types";

const ieltsPrompts = [
  "Describe a skill you would like to improve and explain why it matters to you.",
  "Talk about a public place in your city that you think visitors should see.",
  "Describe a time when you had to solve a problem under pressure.",
];

function formatScore(score: number | null | undefined) {
  return typeof score === "number" ? score.toFixed(1) : "-";
}

function formatProviderLabel(provider: string | null | undefined) {
  if (!provider) {
    return "Unavailable";
  }

  if (provider.startsWith("openai:")) {
    return `OpenAI (${provider.replace("openai:", "")})`;
  }

  if (provider === "local-assessment-fallback") {
    return "Backup IELTS rubric engine";
  }

  if (provider === "local-speech-provider") {
    return "Local development transcript";
  }

  if (provider === "local-assessment-provider") {
    return "Local development scoring";
  }

  return provider;
}

export default function PracticePage() {
  const [user, setUser] = useState<LearnerUser | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState(ieltsPrompts[0]);
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "stopped">("idle");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<LearnerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const { user: currentUser } = await getCurrentUser();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    }

    void bootstrap();

    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioPreviewUrl]);

  async function beginRecording() {
    setError(null);
    setInfo(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser recording is not supported here. Upload an audio file instead.");
      }

      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const recorder = new MediaRecorder(mediaStreamRef.current);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const nextFile = new File([blob], `english-talks-ielts-${Date.now()}.webm`, {
          type: blob.type,
        });
        if (audioPreviewUrl) {
          URL.revokeObjectURL(audioPreviewUrl);
        }
        setAudioFile(nextFile);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        setRecordingState("stopped");
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setRecordingState("recording");

      await recordClientAnalytics([
        {
          eventName: "practice.recording.started",
          eventGroup: "practice",
          path: "/practice",
          properties: { prompt: selectedPrompt },
        },
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Recording could not start");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function runIeltsSession() {
    if (!audioFile) {
      setError("Record or upload an audio answer before scoring.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const created = await createPracticeSession({
        type: "IELTS_SPEAKING",
        promptTitle: selectedPrompt,
        rubric: "ielts",
      });

      const scored = await uploadPracticeAudio(created.session.id, audioFile);
      setCurrentSession(scored.session);
      setInfo("Your IELTS speaking report is ready below.");

      await recordClientAnalytics([
        {
          eventName: "practice.session.completed",
          eventGroup: "practice",
          path: "/practice",
          properties: {
            sessionId: scored.session.id,
            score: scored.session.assessment?.overallScore,
          },
        },
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Practice session failed");
    } finally {
      setLoading(false);
    }
  }

  async function markReviewed() {
    if (!currentSession) {
      return;
    }

    setLoading(true);
    try {
      const response = await markSessionReviewed(currentSession.id);
      setCurrentSession(response.session);
      setInfo("Session marked as reviewed and saved to your IELTS history.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not mark session reviewed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <section className="panel section-space stack-md">
        <span className="pill">Authentication required</span>
        <h1 className="headline">Sign in first to run a scored IELTS session</h1>
        <p className="muted" style={{ margin: 0 }}>
          The practice route now uploads audio, generates a transcript, creates a report, and saves
          your score history. Use the app dashboard to sign in and finish onboarding first.
        </p>
        <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          <Link className="button-primary" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="button-secondary" href="/subscriptions">
            View Premium plans
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel section-space hero-grid">
        <div className="stack-md">
          <span className="pill">IELTS speaking practice</span>
          <h1 className="headline">Upload one answer. Get one saved IELTS report.</h1>
          <p className="muted" style={{ margin: 0 }}>
            This is the v1 learner loop: choose a prompt, record or upload your answer, and receive
            a post-session coaching report with transcript, band estimate, and next steps.
          </p>
        </div>
        <div className="panel section-space stack-sm">
          <strong>Premium reminder</strong>
          <p className="muted" style={{ margin: 0 }}>
            Free tier users can run up to 3 sessions per day. Premium removes the limit and unlocks
            detailed report access.
          </p>
          <Link className="button-secondary" href="/subscriptions">
            Manage plans
          </Link>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel section-space stack-md">
          <label className="vocab-field">
            <span>IELTS prompt</span>
            <select value={selectedPrompt} onChange={(event) => setSelectedPrompt(event.target.value)}>
              {ieltsPrompts.map((prompt) => (
                <option key={prompt} value={prompt}>
                  {prompt}
                </option>
              ))}
            </select>
          </label>

          <div className="panel route-card stack-sm">
            <strong>Prompt</strong>
            <p style={{ margin: 0 }}>{selectedPrompt}</p>
          </div>

          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button className="button-primary" type="button" onClick={beginRecording} disabled={recordingState === "recording"}>
              {recordingState === "recording" ? "Recording..." : "Start recording"}
            </button>
            <button className="button-secondary" type="button" onClick={stopRecording} disabled={recordingState !== "recording"}>
              Stop recording
            </button>
          </div>

          <label className="vocab-field">
            <span>Or upload audio manually</span>
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
            />
          </label>

          {audioPreviewUrl ? (
            <div className="panel route-card stack-sm">
              <strong>Recording preview</strong>
              <audio controls src={audioPreviewUrl} />
            </div>
          ) : null}

          {audioFile ? (
            <div className="panel route-card stack-sm">
              <strong>Ready to score</strong>
              <p className="muted" style={{ margin: 0 }}>
                {audioFile.name} · {(audioFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : null}

          <button className="button-primary" type="button" onClick={runIeltsSession} disabled={loading || !audioFile}>
            {loading ? "Scoring answer..." : "Generate IELTS report"}
          </button>
        </article>

        <article className="panel section-space stack-md">
          <span className="pill">Latest session output</span>
          {currentSession ? (
            <>
              <div className="card-grid">
                {[
                  { label: "Overall", score: currentSession.assessment?.overallScore },
                  { label: "Fluency", score: currentSession.assessment?.fluencyScore },
                  { label: "Grammar", score: currentSession.assessment?.grammarScore },
                  { label: "Vocabulary", score: currentSession.assessment?.vocabularyScore },
                  { label: "Pronunciation", score: currentSession.assessment?.pronunciationScore },
                ].map((card) => (
                  <div key={card.label} className="panel route-card stack-sm">
                    <span className="muted">{card.label}</span>
                    <strong style={{ fontSize: "1.7rem" }}>{formatScore(card.score)}</strong>
                  </div>
                ))}
              </div>

              <div className="panel route-card stack-sm">
                <strong>{currentSession.assessment?.estimatedBandLabel ?? currentSession.status}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {currentSession.assessment?.feedbackText ?? "Assessment details will appear here."}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Feedback engine: {formatProviderLabel(currentSession.assessment?.provider)}
                  {currentSession.assessment?.inferenceLatencyMs ? ` · ${currentSession.assessment.inferenceLatencyMs} ms` : ""}
                </p>
              </div>

              <div className="panel route-card stack-sm">
                <strong>Transcript</strong>
                <p className="muted" style={{ margin: 0 }}>
                  {formatProviderLabel(currentSession.transcript?.provider)}
                  {currentSession.transcript?.transcriptionLatencyMs ? ` · ${currentSession.transcript.transcriptionLatencyMs} ms` : ""}
                </p>
                <p style={{ margin: 0 }}>{currentSession.transcript?.fullText ?? "Transcript not available."}</p>
              </div>

              <div className="panel route-card stack-sm">
                <strong>Coaching priorities</strong>
                <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {(currentSession.assessment?.nextSteps ?? []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                <button className="button-primary" type="button" onClick={markReviewed} disabled={loading}>
                  Mark as reviewed
                </button>
                <Link className="button-secondary" href="/results">
                  Open results history
                </Link>
                {currentSession.reportUrl ? (
                  <a className="button-secondary" href={currentSession.reportUrl} target="_blank" rel="noreferrer">
                    Open report file
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <div className="panel route-card stack-sm">
              <strong>No scored session yet</strong>
              <p className="muted" style={{ margin: 0 }}>
                Your transcript, IELTS dimension scores, next steps, and report download link will
                appear here after you upload one answer.
              </p>
            </div>
          )}
        </article>
      </section>

      {info ? (
        <div className="panel route-card">
          <p style={{ margin: 0, color: "var(--teal-dark)" }}>{info}</p>
        </div>
      ) : null}

      {error ? (
        <div className="panel route-card">
          <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
        </div>
      ) : null}
    </>
  );
}
