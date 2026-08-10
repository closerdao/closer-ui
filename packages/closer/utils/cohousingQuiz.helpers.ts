import { TDF_QUIZ_QUESTIONS, type TdfQuizQuestion } from '../constants/cohousingTdfQuiz';
import type { CohousingApplication } from '../types/cohousingApplication';

export interface TdfQuizGradedAnswer {
  question: TdfQuizQuestion;
  answerId: string;
  answerLabel: string;
  isGradable: boolean;
  isCorrect: boolean | null;
  correctLabel?: string;
}

export const getQuizAnswersFromApplication = (
  application: CohousingApplication,
): Record<string, string> | undefined => {
  const q = application.quiz as Record<string, unknown> | undefined;
  if (!q) {
    return undefined;
  }
  const direct = q.answers;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct as Record<string, string>;
  }
  const nested = q.quiz as Record<string, unknown> | undefined;
  const nestedAnswers = nested?.answers;
  if (
    nestedAnswers &&
    typeof nestedAnswers === 'object' &&
    !Array.isArray(nestedAnswers)
  ) {
    return nestedAnswers as Record<string, string>;
  }
  return undefined;
};

export const getTdfQuizAnswerLabel = (
  question: TdfQuizQuestion,
  answerId: string,
): string => {
  if (!answerId) {
    return '—';
  }
  if (question.type === 'text' || question.type === 'scale') {
    return answerId;
  }
  const option = question.options?.find((o) => o.id === answerId);
  return option?.label ?? answerId;
};

export const getTdfQuizCorrectLabel = (question: TdfQuizQuestion): string => {
  if (!question.correctOptionId) {
    return '—';
  }
  return getTdfQuizAnswerLabel(question, question.correctOptionId);
};

export const gradeTdfQuizAnswers = (
  answers: Record<string, string> | undefined,
): TdfQuizGradedAnswer[] => {
  return TDF_QUIZ_QUESTIONS.map((question) => {
    const answerId = answers?.[question.id] ?? '';
    const isGradable = Boolean(question.correctOptionId);
    const isCorrect = isGradable
      ? answerId === question.correctOptionId
      : null;
    return {
      question,
      answerId,
      answerLabel: getTdfQuizAnswerLabel(question, answerId),
      isGradable,
      isCorrect,
      correctLabel: isGradable ? getTdfQuizCorrectLabel(question) : undefined,
    };
  });
};

export const countObjectiveQuizScore = (
  answers: Record<string, string> | undefined,
): { score: number; total: number } => {
  const objective = TDF_QUIZ_QUESTIONS.filter((q) => q.correctOptionId);
  const score = objective.filter(
    (q) => answers?.[q.id] === q.correctOptionId,
  ).length;
  return { score, total: objective.length };
};
