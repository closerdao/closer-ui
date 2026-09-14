import {
  OnboardingQuest,
  TOKEN_ONBOARDING_TOTAL_CARROTS,
} from '../constants/tokenOnboardingQuests';

export interface TokenOnboardingProgress {
  /** Quest ids the member has claimed, in claim order. */
  completed: string[];
}

const VULGAR_FRACTIONS: Record<string, string> = {
  '0.125': '⅛',
  '0.25': '¼',
  '0.375': '⅜',
  '0.5': '½',
  '0.625': '⅝',
  '0.75': '¾',
  '0.875': '⅞',
};

/**
 * Carrot amounts are fractional down to eighths, so keep every sum on a
 * clean thousandth grid.
 */
const round = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Renders a fractional carrot amount the way a person would say it: `¼`, `1½`,
 * `5`. Falls back to a trimmed decimal for amounts that are not quarters.
 */
export const formatCarrots = (amount: number): string => {
  if (!Number.isFinite(amount) || amount <= 0) return '0';
  const value = round(amount);
  const whole = Math.floor(value);
  const fraction = round(value - whole);
  const glyph = VULGAR_FRACTIONS[String(fraction)];
  if (!glyph) {
    return String(round(value)).replace(/\.0+$/, '');
  }
  return whole > 0 ? `${whole}${glyph}` : glyph;
};

export interface OnboardingQuizScore {
  /** Questions answered right on the first try. */
  correct: number;
  total: number;
}

export type OnboardingQuizScores = Record<string, OnboardingQuizScore>;

/**
 * Rebuilds the per-quest quiz scores from whatever was stored on the user
 * record, dropping anything that does not look like a score.
 */
export const parseQuizScores = (raw: unknown): OnboardingQuizScores => {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: OnboardingQuizScores = {};
  for (const [questId, value] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    const score = value as { correct?: unknown; total?: unknown } | null;
    const correct = Number(score?.correct);
    const total = Number(score?.total);
    if (
      Number.isInteger(correct) &&
      Number.isInteger(total) &&
      total > 0 &&
      correct >= 0 &&
      correct <= total
    ) {
      out[questId] = { correct, total };
    }
  }
  return out;
};

/** Aggregate across quests, for display like `7/10`. */
export const sumQuizScores = (
  scores: OnboardingQuizScores,
): OnboardingQuizScore =>
  Object.values(scores).reduce(
    (sum, score) => ({
      correct: sum.correct + score.correct,
      total: sum.total + score.total,
    }),
    { correct: 0, total: 0 },
  );

export const carrotsForQuests = (quests: OnboardingQuest[]): number =>
  round(quests.reduce((total, quest) => total + quest.carrots, 0));

export const carrotsEarned = (
  completed: string[],
  quests: OnboardingQuest[],
): number =>
  round(
    quests
      .filter((quest) => completed.includes(quest.id))
      .reduce((total, quest) => total + quest.carrots, 0),
  );

/**
 * Rebuilds progress from whatever was stored (localStorage or the user record),
 * dropping ids that no longer exist so a renamed quest cannot strand a member
 * mid-flow. Carrots are always recomputed from the surviving ids rather than
 * trusted from storage.
 */
export const parseOnboardingProgress = (
  raw: unknown,
  quests: OnboardingQuest[],
): TokenOnboardingProgress => {
  const source =
    typeof raw === 'string'
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })()
      : raw;

  const stored = (source as { completed?: unknown } | null)?.completed;
  if (!Array.isArray(stored)) return { completed: [] };

  const known = new Set(quests.map((quest) => quest.id));
  const seen = new Set<string>();
  const completed = stored.filter((id): id is string => {
    if (typeof id !== 'string' || !known.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return { completed };
};

/** Quests unlock in order: quest N opens once quest N-1 has been claimed. */
export const isQuestUnlocked = (
  index: number,
  completed: string[],
  quests: OnboardingQuest[],
): boolean => {
  if (index <= 0) return true;
  const previous = quests[index - 1];
  return Boolean(previous && completed.includes(previous.id));
};

/** Index of the first unclaimed quest, or -1 when the flow is finished. */
export const nextQuestIndex = (
  completed: string[],
  quests: OnboardingQuest[],
): number => quests.findIndex((quest) => !completed.includes(quest.id));

export const isOnboardingComplete = (
  completed: string[],
  quests: OnboardingQuest[],
): boolean => quests.every((quest) => completed.includes(quest.id));

export { TOKEN_ONBOARDING_TOTAL_CARROTS };
