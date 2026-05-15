export type MarketingPage = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  heroDescription: string;
  ctaLabel: string;
  bullets: string[];
};

export type ProductCard = {
  slug: string;
  title: string;
  description: string;
  category: "Assessment" | "Practice" | "Career" | "Vocabulary";
};

export type DashboardMetric = {
  label: string;
  value: string;
  trend: string;
};

export type CourseTrack = {
  title: string;
  targetLevel: string;
  pace: string;
  focus: string;
};

export type VocabularyExerciseType = "READ_ALOUD" | "KEYWORD_QA" | "STORY";

export type VocabularyTopic = {
  slug: string;
  title: string;
  emoji: string;
  description: string;
  category: "Lifestyle" | "Career" | "Culture" | "Academic";
};

export type VocabularyKeywordSeed = {
  term: string;
  definition: string;
  samplePrompt: string;
};

export type VocabularyAdvancedOptions = {
  level: "A2" | "B1" | "B2" | "C1";
  targetMinutes: number;
  wordCount: number;
  timerSeconds: number;
  feedbackMode: "basic" | "detailed" | "exam";
  accentFocus: "general" | "american" | "british";
  includeDefinitions: boolean;
  includeHints: boolean;
  includeTimer: boolean;
  exerciseTypes: VocabularyExerciseType[];
};

