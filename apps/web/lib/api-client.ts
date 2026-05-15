import type { BillingPlan, DashboardResponse, LearnerSession, LearnerUser, SubscriptionEntitlement } from "./learner-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type JsonRecord = Record<string, unknown>;

async function request<T>(path: string, init?: RequestInit, retryOnRefresh = true): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 && retryOnRefresh) {
    const refreshResponse = await fetch(`${apiBaseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as JsonRecord | null;
    throw new Error(typeof payload?.error === "string" ? payload.error : "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function registerUser(payload: {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}) {
  return request<{ user: LearnerUser; accessToken: string }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export async function loginUser(payload: { email: string; password: string }) {
  return request<{ user: LearnerUser; accessToken: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  }, false);
}

export async function logoutUser() {
  return request<{ message: string }>("/api/v1/auth/logout", {
    method: "POST",
  }, false);
}

export async function getCurrentUser() {
  return request<{ user: LearnerUser }>("/api/v1/auth/me");
}

export async function getGoogleAuthorizationUrl() {
  return request<{ authorizationUrl: string }>("/api/v1/auth/google/start");
}

export async function completeOnboarding(payload: {
  cefrLevel: string;
  targetExam: "IELTS" | "GENERAL_ENGLISH" | "JOB_INTERVIEW";
  targetBand?: number;
  studyReason: string;
  timezone?: string;
}) {
  return request<{ user: LearnerUser; message: string }>("/api/v1/user/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getDashboard() {
  return request<DashboardResponse>("/api/v1/user/dashboard");
}

export async function getSessions() {
  return request<{ sessions: LearnerSession[] }>("/api/v1/user/sessions");
}

export async function createPracticeSession(payload: {
  type: "IELTS_SPEAKING" | "LEVEL_TEST";
  promptTitle: string;
  rubric: "ielts";
  durationSeconds?: number;
}) {
  return request<{ session: LearnerSession; entitlement: SubscriptionEntitlement }>("/api/v1/practice/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadPracticeAudio(sessionId: string, audioFile: File) {
  const formData = new FormData();
  formData.append("audio", audioFile);

  const response = await fetch(`${apiBaseUrl}/api/v1/practice/sessions/${sessionId}/audio`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as JsonRecord | null;
    throw new Error(typeof payload?.error === "string" ? payload.error : "Audio upload failed");
  }

  return response.json() as Promise<{ session: LearnerSession }>;
}

export async function getPracticeSession(sessionId: string) {
  return request<{ session: LearnerSession }>(`/api/v1/practice/sessions/${sessionId}`);
}

export async function markSessionReviewed(sessionId: string) {
  return request<{ session: LearnerSession }>(`/api/v1/practice/sessions/${sessionId}/review`, {
    method: "POST",
  });
}

export async function getBillingPlans() {
  return request<{ plans: BillingPlan[] }>("/api/v1/billing/plans", {
    cache: "no-store",
  });
}

export async function getSubscription() {
  return request<SubscriptionEntitlement>("/api/v1/billing/subscription");
}

export async function startCheckout(planCode: string) {
  return request<{ checkout: { checkoutUrl: string; provider: string }; entitlement: SubscriptionEntitlement }>(
    "/api/v1/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify({ planCode }),
    },
  );
}

export async function cancelSubscription() {
  return request<{ message: string; entitlement: SubscriptionEntitlement }>("/api/v1/billing/cancel", {
    method: "POST",
  });
}

export async function recordClientAnalytics(events: Array<{ eventName: string; eventGroup?: string; path?: string; properties?: JsonRecord }>) {
  return request<{ recorded: boolean; count: number }>("/api/v1/analytics/events", {
    method: "POST",
    body: JSON.stringify({ events }),
  }).catch(() => ({ recorded: false, count: 0 }));
}
