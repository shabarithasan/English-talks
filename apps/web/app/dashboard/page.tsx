"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  completeOnboarding,
  getAuthStatus,
  getCurrentUser,
  getDashboard,
  getGoogleAuthorizationUrl,
  loginUser,
  logoutUser,
  recordClientAnalytics,
  registerUser,
} from "../../lib/api-client";
import type { AuthStatus, DashboardResponse } from "../../lib/learner-types";

type AuthMode = "login" | "register";

const emptyDashboard: DashboardResponse | null = null;

export default function DashboardPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(emptyDashboard);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [onboardingForm, setOnboardingForm] = useState({
    cefrLevel: "B1",
    targetExam: "IELTS" as const,
    targetBand: "7",
    studyReason: "I want to improve my IELTS speaking score and become more confident in structured answers.",
  });

  async function loadDashboard() {
    const [{ user }, dashboardPayload] = await Promise.all([getCurrentUser(), getDashboard()]);
    setDashboard({
      ...dashboardPayload,
      user,
    });
    return dashboardPayload;
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        setError(null);

        const status = await getAuthStatus();
        setAuthStatus(status);

        const loadedDashboard = await loadDashboard();
        await recordClientAnalytics([
          {
            eventName: "dashboard.view",
            eventGroup: "engagement",
            path: "/dashboard",
            properties: {
              hasLatestResult: Boolean(loadedDashboard.latestResult),
            },
          },
        ]);
      } catch (caughtError) {
        setDashboard(null);

        try {
          const status = await getAuthStatus();
          setAuthStatus(status);

          if (!status.loginEnabled) {
            setError(status.message);
          } else if (caughtError instanceof Error) {
            setError(caughtError.message);
          }
        } catch {
          setError(caughtError instanceof Error ? caughtError.message : "The dashboard could not be loaded.");
        }
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  const isAuthenticated = Boolean(dashboard?.user);
  const needsOnboarding = Boolean(isAuthenticated && !dashboard?.user.onboardingCompleted);
  const googleEnabled = Boolean(authStatus?.persistentAuthEnabled && authStatus?.googleConfigured);

  const bestWeakArea = useMemo(
    () => dashboard?.weakAreas.find((area) => area.averageScore !== null) ?? null,
    [dashboard],
  );

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!authStatus?.loginEnabled) {
        throw new Error(authStatus?.message ?? "Authentication is not available on this deployment.");
      }

      if (authMode === "register") {
        await registerUser({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else {
        await loginUser({
          email: authForm.email,
          password: authForm.password,
        });
      }

      const loadedDashboard = await loadDashboard();
      await recordClientAnalytics([
        {
          eventName: authMode === "register" ? "auth.register.success" : "auth.login.success",
          eventGroup: "auth",
          path: "/dashboard",
        },
        {
          eventName: "dashboard.view",
          eventGroup: "engagement",
          path: "/dashboard",
          properties: {
            hasLatestResult: Boolean(loadedDashboard.latestResult),
          },
        },
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setError(null);

    try {
      if (!googleEnabled) {
        throw new Error(
          authStatus?.persistentAuthEnabled
            ? "Google sign-in is not configured on this deployment yet."
            : authStatus?.message ?? "Google sign-in is unavailable right now.",
        );
      }

      const { authorizationUrl } = await getGoogleAuthorizationUrl();
      window.location.assign(authorizationUrl);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Google sign-in is unavailable");
      setSubmitting(false);
    }
  }

  async function handleOnboardingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await completeOnboarding({
        cefrLevel: onboardingForm.cefrLevel,
        targetExam: onboardingForm.targetExam,
        targetBand: Number(onboardingForm.targetBand),
        studyReason: onboardingForm.studyReason,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await loadDashboard();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Onboarding could not be saved");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setSubmitting(true);

    try {
      await logoutUser();
      setDashboard(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="panel section-space stack-md">
        <span className="pill">Learner app</span>
        <h1 className="headline">Loading your English Talks dashboard...</h1>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <section className="panel section-space hero-grid">
          <div className="stack-md">
            <span className="pill">IELTS-focused launch</span>
            <h1 className="headline">Sign in to start your IELTS speaking growth loop</h1>
            <p className="muted" style={{ margin: 0 }}>
              Build a baseline, upload speaking answers, get post-session AI coaching, and track
              your band trend over time.
            </p>
          </div>
          <form className="panel section-space stack-sm" onSubmit={handleAuthSubmit}>
            <strong>{authMode === "register" ? "Create your learner account" : "Welcome back"}</strong>
            {!authStatus?.loginEnabled ? (
              <div className="panel route-card">
                <p style={{ margin: 0, color: "var(--orange)" }}>
                  {authStatus?.message ?? "Authentication is temporarily unavailable on this deployment."}
                </p>
              </div>
            ) : null}
            {authMode === "register" ? (
              <label className="vocab-field">
                <span>Full name</span>
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Your full name"
                />
              </label>
            ) : null}
            <label className="vocab-field">
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </label>
            <label className="vocab-field">
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 8 characters"
              />
            </label>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <button className="button-primary" type="submit" disabled={submitting || !authStatus?.loginEnabled}>
                {submitting ? "Please wait..." : authMode === "register" ? "Create account" : "Sign in"}
              </button>
              <button className="button-secondary" type="button" onClick={handleGoogleSignIn} disabled={submitting || !googleEnabled}>
                {googleEnabled ? "Continue with Google" : "Google sign-in unavailable"}
              </button>
            </div>
            <button
              className="button-secondary"
              type="button"
              onClick={() => setAuthMode((current) => (current === "login" ? "register" : "login"))}
              disabled={!authStatus?.registerEnabled}
            >
              {authMode === "login" ? "Need an account?" : "Already have an account?"}
            </button>
          </form>
        </section>

        {error ? (
          <div className="panel route-card">
            <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
          </div>
        ) : null}
      </>
    );
  }

  if (needsOnboarding && dashboard) {
    return (
      <>
        <section className="panel section-space stack-md">
          <span className="pill">Step 1 of 1</span>
          <h1 className="headline">Set up your IELTS goal</h1>
          <p className="muted" style={{ margin: 0 }}>
            This onboarding captures your current level and target band so the dashboard and reports
            can recommend the right speaking work.
          </p>
        </section>

        <form className="panel section-space stack-md" onSubmit={handleOnboardingSubmit}>
          <div className="vocab-form-grid">
            <label className="vocab-field">
              <span>Current CEFR level</span>
              <select
                value={onboardingForm.cefrLevel}
                onChange={(event) => setOnboardingForm((current) => ({ ...current, cefrLevel: event.target.value }))}
              >
                {["A2", "B1", "B2", "C1"].map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            <label className="vocab-field">
              <span>Target IELTS band</span>
              <input
                type="number"
                min={5}
                max={9}
                step={0.5}
                value={onboardingForm.targetBand}
                onChange={(event) => setOnboardingForm((current) => ({ ...current, targetBand: event.target.value }))}
              />
            </label>
          </div>

          <label className="vocab-field">
            <span>Why are you studying now?</span>
            <textarea
              rows={5}
              value={onboardingForm.studyReason}
              onChange={(event) => setOnboardingForm((current) => ({ ...current, studyReason: event.target.value }))}
            />
          </label>

          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <button className="button-primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Complete onboarding"}
            </button>
            <button className="button-secondary" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </form>

        {error ? (
          <div className="panel route-card">
            <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
          </div>
        ) : null}
      </>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <>
      <section className="panel section-space stack-md">
        <div className="hero-grid">
          <div className="stack-sm">
            <span className="pill">
              {dashboard.user.targetExam ?? "IELTS"} target · Band {dashboard.user.targetBand?.toFixed(1) ?? "7.0"}
            </span>
            <h1 className="headline">Welcome back, {dashboard.user.fullName.split(" ")[0]}.</h1>
            <p className="muted" style={{ margin: 0 }}>
              Your web-first IELTS workspace is ready with saved speaking reports, entitlement-aware
              limits, and next-step coaching.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="button-primary" href="/practice">
              Start IELTS practice
            </Link>
            <Link className="button-secondary" href="/subscriptions">
              {dashboard.entitlement.isPremium ? "Manage Premium" : "Upgrade to Premium"}
            </Link>
            <button className="button-secondary" type="button" onClick={handleLogout} disabled={submitting}>
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {[
          {
            label: "Current CEFR",
            value: dashboard.user.cefrLevel ?? "B1",
            trend: dashboard.latestResult?.assessment?.estimatedBandLabel ?? "Keep practicing",
          },
          {
            label: "Average IELTS band",
            value: dashboard.metrics.averageBand?.toFixed(1) ?? "-",
            trend: dashboard.bandTrend.length > 1 ? "Trend tracking active" : "Need more scored sessions",
          },
          {
            label: "Free sessions left today",
            value: dashboard.metrics.freeTierRemaining.toString(),
            trend: dashboard.entitlement.isPremium ? "Unlimited on Premium" : "Upgrade for unlimited mocks",
          },
          {
            label: "Streak + XP",
            value: `${dashboard.metrics.streakCount} / ${dashboard.metrics.xpPoints}`,
            trend: "Daily momentum",
          },
        ].map((metric) => (
          <article key={metric.label} className="panel route-card stack-sm">
            <span className="muted">{metric.label}</span>
            <strong style={{ fontSize: "1.8rem" }}>{metric.value}</strong>
            <span style={{ color: "var(--teal-dark)" }}>{metric.trend}</span>
          </article>
        ))}
      </section>

      <section className="feature-grid">
        <article className="panel section-space stack-sm">
          <span className="pill">Recommended next</span>
          {dashboard.recommendations.map((item) => (
            <div key={item} className="panel route-card">
              <p style={{ margin: 0 }}>{item}</p>
            </div>
          ))}
        </article>

        <article className="panel section-space stack-sm">
          <span className="pill">Weak-skill focus</span>
          {bestWeakArea ? (
            <div className="panel route-card stack-sm">
              <strong>{bestWeakArea.label}</strong>
              <p className="muted" style={{ margin: 0 }}>
                Average score: {bestWeakArea.averageScore?.toFixed(1) ?? "-"}. Prioritize this area
                in your next IELTS speaking response.
              </p>
            </div>
          ) : (
            <div className="panel route-card stack-sm">
              <strong>Need more data</strong>
              <p className="muted" style={{ margin: 0 }}>
                Complete your first scored IELTS session to unlock weak-area summaries.
              </p>
            </div>
          )}

          <div className="panel route-card stack-sm">
            <strong>Entitlement</strong>
            <p className="muted" style={{ margin: 0 }}>
              {dashboard.entitlement.isPremium
                ? `Premium active with ${dashboard.entitlement.subscription?.entitledFeatures.length ?? 0} unlocked benefits.`
                : "Free tier active. Premium removes daily limits and unlocks deeper report detail."}
            </p>
          </div>
        </article>
      </section>

      <section className="panel section-space stack-md">
        <div className="hero-grid">
          <div className="stack-sm">
            <span className="pill">Recent IELTS results</span>
            <h2 className="headline" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
              Saved speaking history
            </h2>
          </div>
          <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Link className="button-secondary" href="/results">
              Open all reports
            </Link>
          </div>
        </div>

        <div className="card-grid">
          {dashboard.recentSessions.length > 0 ? (
            dashboard.recentSessions.map((session) => (
              <article key={session.id} className="panel route-card stack-sm">
                <span className="pill">{session.promptTitle ?? "IELTS speaking prompt"}</span>
                <strong style={{ fontSize: "1.2rem" }}>
                  {session.assessment?.estimatedBandLabel ?? session.status}
                </strong>
                <p className="muted" style={{ margin: 0 }}>
                  {session.assessment?.feedbackText ?? "Waiting for assessment output."}
                </p>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span className="pill">Status: {session.status}</span>
                  {session.reportUrl ? (
                    <a className="button-secondary" href={session.reportUrl} target="_blank" rel="noreferrer">
                      Open report
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <article className="panel route-card stack-sm">
              <strong>No scored IELTS sessions yet</strong>
              <p className="muted" style={{ margin: 0 }}>
                Start your first speaking upload to generate a transcript, band estimate, and report.
              </p>
            </article>
          )}
        </div>
      </section>

      {error ? (
        <div className="panel route-card">
          <p style={{ margin: 0, color: "var(--orange)" }}>{error}</p>
        </div>
      ) : null}
    </>
  );
}
