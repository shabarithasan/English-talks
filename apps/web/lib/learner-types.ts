export type LearnerUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  cefrLevel: string | null;
  onboardingCompleted: boolean;
  targetExam: string | null;
  targetBand: number | null;
  studyReason: string | null;
  streakCount: number;
  xpPoints: number;
  timezone: string | null;
  preferredLocale: string;
};

export type SessionAssessment = {
  rubric: string;
  overallScore: number;
  grammarScore: number | null;
  vocabularyScore: number | null;
  fluencyScore: number | null;
  pronunciationScore: number | null;
  cefrLevel: string | null;
  feedbackText: string;
  feedback: {
    feedback: string[];
    dimensionFeedback: Array<{
      key: string;
      score: number;
      note: string;
    }>;
  } | null;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  estimatedBandLabel: string | null;
  createdAt: string;
};

export type LearnerSession = {
  id: string;
  type: string;
  status: string;
  rubric: string;
  transcriptStatus: string;
  scoringStatus: string;
  reviewStatus: string;
  startedAt: string;
  createdAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  promptTitle: string | null;
  audioUrl: string | null;
  audioMimeType: string | null;
  audioBytes: number | null;
  uploadedAt: string | null;
  transcribedAt: string | null;
  scoredAt: string | null;
  reviewedAt: string | null;
  processingError: string | null;
  reportUrl: string | null;
  transcript: {
    fullText: string;
    languageCode: string;
    confidence: number | null;
    segments: Array<{
      id: string;
      startMs: number;
      endMs: number;
      speakerLabel?: string | null;
      text: string;
    }>;
  } | null;
  assessment: SessionAssessment | null;
};

export type SubscriptionEntitlement = {
  isPremium: boolean;
  subscription: null | {
    id: string;
    provider: string;
    planCode: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    entitledFeatures: string[];
  };
};

export type DashboardResponse = {
  user: LearnerUser;
  latestResult: LearnerSession | null;
  recentSessions: LearnerSession[];
  bandTrend: Array<{
    date: string;
    overallScore: number;
  }>;
  weakAreas: Array<{
    key: string;
    label: string;
    averageScore: number | null;
  }>;
  metrics: {
    totalSessions: number;
    totalPracticeMinutes: number;
    averageBand: number | null;
    todayUsage: number;
    freeTierRemaining: number;
    streakCount: number;
    xpPoints: number;
  };
  recommendations: string[];
  entitlement: SubscriptionEntitlement;
};

export type BillingPlan = {
  code: string;
  name: string;
  currency: string;
  amount: number;
  interval: string;
  priceLabel: string;
  features: string[];
};
