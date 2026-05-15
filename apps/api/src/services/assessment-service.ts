type AssessmentInput = {
  transcript: string;
  rubric: string;
};

export async function assessTranscript({ transcript, rubric }: AssessmentInput) {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const baseScore = Math.max(5.5, Math.min(8.5, 5.5 + wordCount / 40));

  return {
    rubric,
    overallScore: Number(baseScore.toFixed(1)),
    cefrLevel: baseScore >= 7.5 ? "C1" : baseScore >= 6.5 ? "B2" : "B1",
    grammarScore: Number((baseScore - 0.3).toFixed(1)),
    vocabularyScore: Number((baseScore + 0.1).toFixed(1)),
    fluencyScore: Number(baseScore.toFixed(1)),
    pronunciationScore: Number((baseScore - 0.1).toFixed(1)),
    feedback: [
      "Open with a direct answer before expanding with examples.",
      "Add one more concrete detail to improve specificity.",
      "Review tense consistency in longer answers under pressure.",
    ],
  };
}

