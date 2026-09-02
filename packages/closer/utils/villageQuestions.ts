import { VILLAGE_COLLECTION } from '../constants/village.constants';
import api from './api';

/**
 * The founder's half of lead enrichment.
 *
 * The nightly job writes `lead.enrichment.openQuestions` as the ambassador's
 * script for the next call. These two routes hand those same questions to the
 * village's own people — its creator, its assigned ambassadors, its managers —
 * so they can answer them directly, and hand over nothing else: never the AI
 * brief, the sourced facts or the fit scoring. A founder reading their own
 * questions must not read the CRM's assessment of them.
 *
 * Answers land on `village.fields`, keyed by a hash of the question text.
 * Enrichment rewords freely between runs, so keying by position would silently
 * reattach an answer to a different question.
 */

/**
 * `enrichment` is a question the job raised; `answered` is one the village has
 * already replied to — including a question enrichment has since reworded away,
 * whose answer stays readable. Open set: the job may add more labels.
 */
export type VillageQuestionSource = 'enrichment' | 'answered' | string;

export interface VillageQuestion {
  /** A hash of the question text — stable across rewordings only by accident,
      which is the point: a reworded question is a new question. */
  id: string;
  question: string;
  answer?: string | null;
  answeredAt?: string | null;
  source?: VillageQuestionSource;
}

export interface VillageQuestions {
  villageId: string;
  leadId: string | null;
  questions: VillageQuestion[];
}

/** One entry of the POST body. `answer: null` clears an answer. */
export interface VillageAnswerInput {
  id: string;
  answer: string | null;
}

/** Carries the status so a caller can tell "not yours" from "went wrong". */
export class VillageQuestionsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'VillageQuestionsError';
    this.status = status;
  }
}

const toQuestionsError = (err: unknown): VillageQuestionsError => {
  const response = (
    err as { response?: { status?: number; data?: Record<string, any> } }
  ).response;
  const body = response?.data;
  const message =
    (typeof body?.error === 'string' && body.error) ||
    (typeof body?.error?.message === 'string' && body.error.message) ||
    (typeof body?.message === 'string' && body.message) ||
    (err instanceof Error ? err.message : 'Could not load the questions');
  return new VillageQuestionsError(message, response?.status ?? 0);
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * Reads the payload defensively: the route may answer bare or wrapped in
 * `results`, and a row without an id or a question text is unanswerable, so it
 * is dropped rather than rendered as a blank card.
 */
export function normalizeVillageQuestions(
  data: unknown,
  fallbackVillageId = '',
): VillageQuestions {
  const body = (data as any)?.results ?? data;
  const rows = Array.isArray(body)
    ? body
    : Array.isArray(body?.questions)
    ? body.questions
    : [];

  const questions: VillageQuestion[] = rows
    .map((row: any) => {
      const id = asString(row?.id);
      const question = asString(row?.question);
      if (!id || !question) return null;
      return {
        id,
        question: question.trim(),
        answer: asString(row?.answer),
        answeredAt: asString(row?.answeredAt),
        source: asString(row?.source) || undefined,
      } as VillageQuestion;
    })
    .filter((row: VillageQuestion | null): row is VillageQuestion =>
      Boolean(row),
    );

  return {
    villageId: asString(body?.villageId) || fallbackVillageId,
    leadId: asString(body?.leadId),
    questions,
  };
}

/** `GET /village/:id/questions` — singular collection, like the deploy route. */
export async function getVillageQuestions(
  villageId: string,
): Promise<VillageQuestions> {
  try {
    // Per-viewer and edited on the next page, so never served from the cache.
    const { data } = await api.get(
      `/${VILLAGE_COLLECTION}/${villageId}/questions`,
      { cache: false } as any,
    );
    return normalizeVillageQuestions(data, villageId);
  } catch (err) {
    throw toQuestionsError(err);
  }
}

/**
 * `POST /village/:id/answers` — returns the updated list. Answers merge, so a
 * partly-filled form is safe to submit and only the changed rows need sending.
 */
export async function saveVillageAnswers(
  villageId: string,
  answers: VillageAnswerInput[],
): Promise<VillageQuestions> {
  try {
    const { data } = await api.post(
      `/${VILLAGE_COLLECTION}/${villageId}/answers`,
      { answers },
    );
    return normalizeVillageQuestions(data, villageId);
  } catch (err) {
    throw toQuestionsError(err);
  }
}

/** Trims, and treats an empty box as "no answer" rather than an empty answer. */
const cleanAnswer = (value: string | null | undefined): string | null => {
  const trimmed = (value || '').trim();
  return trimmed ? trimmed : null;
};

/**
 * The rows a draft actually changed. Sending the untouched ones back would
 * rewrite their `answeredAt` — and, once enrichment has reworded a question,
 * would re-save an answer the founder never looked at.
 */
export function villageAnswerChanges(
  questions: VillageQuestion[],
  drafts: Record<string, string>,
): VillageAnswerInput[] {
  return questions
    .filter((question) => {
      // A question the form never rendered cannot have been changed.
      if (!(question.id in drafts)) return false;
      return cleanAnswer(drafts[question.id]) !== cleanAnswer(question.answer);
    })
    .map((question) => ({
      id: question.id,
      answer: cleanAnswer(drafts[question.id]),
    }));
}

/** Drafts seeded from whatever is already saved, so the form opens filled in. */
export function villageAnswerDrafts(
  questions: VillageQuestion[],
): Record<string, string> {
  return Object.fromEntries(
    questions.map((question) => [question.id, question.answer || '']),
  );
}

export function countAnsweredVillageQuestions(questions: VillageQuestion[]): {
  answered: number;
  total: number;
} {
  return {
    answered: questions.filter((question) => cleanAnswer(question.answer))
      .length,
    total: questions.length,
  };
}
