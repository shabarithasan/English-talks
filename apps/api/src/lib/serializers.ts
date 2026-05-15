import type { Assessment, Session, Transcript, User } from "@prisma/client";

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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function serializeSession(
  session: Session & {
    transcript?: Transcript | null;
    assessment?: Assessment | null;
  },
) {
  return {
    id: session.id,
    type: session.type,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    durationSeconds: session.durationSeconds,
    promptTitle: session.promptTitle,
    transcript: session.transcript?.fullText ?? null,
    assessment: session.assessment
      ? {
          rubric: session.assessment.rubric,
          overallScore: session.assessment.overallScore,
          grammarScore: session.assessment.grammarScore,
          vocabularyScore: session.assessment.vocabularyScore,
          fluencyScore: session.assessment.fluencyScore,
          pronunciationScore: session.assessment.pronunciationScore,
          cefrLevel: session.assessment.cefrLevel,
          feedbackText: session.assessment.feedbackText,
        }
      : null,
  };
}

