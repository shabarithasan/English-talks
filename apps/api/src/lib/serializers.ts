import type { Assessment, Session, Transcript, TranscriptSegment, User } from "@prisma/client";

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    cefrLevel: user.cefrLevel,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    preferredLocale: user.preferredLocale,
    organizationId: user.organizationId,
    onboardingCompleted: user.onboardingCompleted,
    targetExam: user.targetExam,
    targetBand: user.targetBand,
    studyReason: user.studyReason,
    streakCount: user.streakCount,
    xpPoints: user.xpPoints,
    lastActiveAt: user.lastActiveAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

type SessionGraph = Session & {
  transcript?: (Transcript & { segments?: TranscriptSegment[] }) | null;
  assessment?: Assessment | null;
};

export function serializeAssessment(assessment: Assessment | null | undefined) {
  if (!assessment) {
    return null;
  }

  return {
    rubric: assessment.rubric,
    overallScore: assessment.overallScore,
    grammarScore: assessment.grammarScore,
    vocabularyScore: assessment.vocabularyScore,
    fluencyScore: assessment.fluencyScore,
    pronunciationScore: assessment.pronunciationScore,
    cefrLevel: assessment.cefrLevel,
    feedbackText: assessment.feedbackText,
    feedback: assessment.feedbackJson ? JSON.parse(assessment.feedbackJson) : null,
    strengths: assessment.strengths ? JSON.parse(assessment.strengths) : [],
    weaknesses: assessment.weaknesses ? JSON.parse(assessment.weaknesses) : [],
    nextSteps: assessment.nextSteps ? JSON.parse(assessment.nextSteps) : [],
    estimatedBandLabel: assessment.estimatedBandLabel,
    createdAt: assessment.createdAt,
  };
}

export function serializeSession(session: SessionGraph) {
  return {
    id: session.id,
    type: session.type,
    status: session.status,
    rubric: session.rubric,
    transcriptStatus: session.transcriptStatus,
    scoringStatus: session.scoringStatus,
    reviewStatus: session.reviewStatus,
    startedAt: session.startedAt,
    createdAt: session.createdAt,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    promptTitle: session.promptTitle,
    audioUrl: session.audioUrl,
    audioMimeType: session.audioMimeType,
    audioBytes: session.audioBytes,
    audioStorageKey: session.audioStorageKey,
    uploadedAt: session.uploadedAt,
    transcribedAt: session.transcribedAt,
    scoredAt: session.scoredAt,
    reviewedAt: session.reviewedAt,
    processingError: session.processingError,
    reportUrl: session.reportUrl,
    transcript: session.transcript
      ? {
          fullText: session.transcript.fullText,
          languageCode: session.transcript.languageCode,
          confidence: session.transcript.confidence,
          createdAt: session.transcript.createdAt,
          segments: session.transcript.segments?.map((segment) => ({
            id: segment.id,
            startMs: segment.startMs,
            endMs: segment.endMs,
            speakerLabel: segment.speakerLabel,
            text: segment.text,
          })) ?? [],
        }
      : null,
    assessment: serializeAssessment(session.assessment),
  };
}
