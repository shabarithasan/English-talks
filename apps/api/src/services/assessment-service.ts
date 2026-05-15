type AssessmentInput = {
  transcript: string;
  rubric: "cefr" | "ielts" | "interview";
};

export type StructuredAssessment = {
  rubric: string;
  overallScore: number;
  cefrLevel: string;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  estimatedBandLabel: string;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  feedback: string[];
  dimensionFeedback: Array<{
    key: "fluency" | "grammar" | "vocabulary" | "pronunciation";
    score: number;
    note: string;
  }>;
};

interface AssessmentProvider {
  score(input: AssessmentInput): Promise<StructuredAssessment>;
}

class LocalAssessmentProvider implements AssessmentProvider {
  async score({ transcript, rubric }: AssessmentInput): Promise<StructuredAssessment> {
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    const sentenceCount = transcript.split(/[.!?]/).filter((segment) => segment.trim().length > 0).length || 1;
    const lexicalVariety = new Set(transcript.toLowerCase().split(/\W+/).filter(Boolean)).size;
    const baseScore = Math.max(5.5, Math.min(8.5, 5.7 + wordCount / 38 + lexicalVariety / 120 - sentenceCount / 20));

    const grammarScore = Number((baseScore - 0.2).toFixed(1));
    const vocabularyScore = Number((baseScore + 0.1).toFixed(1));
    const fluencyScore = Number(baseScore.toFixed(1));
    const pronunciationScore = Number((baseScore - 0.1).toFixed(1));
    const overallScore = Number(((grammarScore + vocabularyScore + fluencyScore + pronunciationScore) / 4).toFixed(1));
    const cefrLevel = overallScore >= 7.5 ? "C1" : overallScore >= 6.5 ? "B2" : overallScore >= 5.8 ? "B1" : "A2";
    const estimatedBandLabel = rubric === "ielts" ? `Estimated IELTS Band ${overallScore.toFixed(1)}` : `${cefrLevel} speaking performance`;

    return {
      rubric,
      overallScore,
      cefrLevel,
      grammarScore,
      vocabularyScore,
      fluencyScore,
      pronunciationScore,
      estimatedBandLabel,
      strengths: [
        "Delivers a direct response before expanding ideas.",
        "Uses enough topic vocabulary to sound task-aware.",
      ],
      weaknesses: [
        "Needs one more specific example to improve support.",
        "Can smooth transitions between ideas under time pressure.",
      ],
      nextSteps: [
        "Practice 2-minute answers with a clear opening, example, and closing sentence.",
        "Review linking phrases and tense consistency for longer responses.",
      ],
      feedback: [
        "Start with a clear answer, then support it with one vivid example.",
        "Aim for smoother transitions between your main points.",
        "Keep building topic-specific vocabulary to sound more natural and precise.",
      ],
      dimensionFeedback: [
        {
          key: "fluency",
          score: fluencyScore,
          note: "Delivery is generally smooth, but a stronger closing sentence would improve coherence.",
        },
        {
          key: "grammar",
          score: grammarScore,
          note: "Sentence control is solid overall, with small risks when ideas become more complex.",
        },
        {
          key: "vocabulary",
          score: vocabularyScore,
          note: "Vocabulary range is appropriate, and more precise collocations would lift the band.",
        },
        {
          key: "pronunciation",
          score: pronunciationScore,
          note: "Speech is easy to follow, with minor stress and pacing opportunities.",
        },
      ],
    };
  }
}

const assessmentProvider: AssessmentProvider = new LocalAssessmentProvider();

export async function assessTranscript(input: AssessmentInput) {
  return assessmentProvider.score(input);
}

export function buildAssessmentFeedbackText(assessment: StructuredAssessment) {
  return assessment.feedback.join(" ");
}
