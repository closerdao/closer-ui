import { useTranslations } from 'next-intl';

import { OnboardingQuest } from '../../constants/tokenOnboardingQuests';
import { formatCarrots } from '../../utils/tokenOnboarding.helpers';
import Button from '../ui/Button';
import InlineText from './InlineText';
import WalletGate, { WalletGateStatus } from './WalletGate';

export interface QuestGateState {
  /** Option the member last picked on a quiz gate. */
  picked: number | null;
  /** Options already ruled out, struck through so they read as spent. */
  wrongPicks: number[];
  /** One flag per item on a checklist gate. */
  checks: boolean[];
  /**
   * Genuine wrong answers on the quiz. `wrongPicks` cannot stand in for this:
   * a correct pick strikes every other option out for display, so the two
   * look identical after the fact.
   */
  misses: number;
  /** Micro quiz: the member's latest pick per question. */
  answers: (number | null)[];
  /** Micro quiz: options ruled out, per question. */
  questionWrongPicks: number[][];
  /** Micro quiz: genuine wrong answers, per question. */
  questionMisses: number[];
  /**
   * Set from the wallet itself on a wallet gate, never by the member. The page
   * refreshes it on every render, so it is always the live answer.
   */
  isWalletVerified: boolean;
  /**
   * Set by the page when an injected wallet provider is present in the
   * browser (walletDetect gates). Never ticked by the member.
   */
  isWalletDetected: boolean;
}

export const emptyGateState = (quest: OnboardingQuest): QuestGateState => ({
  picked: null,
  wrongPicks: [],
  misses: 0,
  checks:
    quest.gate.type === 'check' ? quest.gate.items.map(() => false) : [],
  answers:
    quest.gate.type === 'microQuiz'
      ? quest.gate.questions.map(() => null)
      : [],
  questionWrongPicks:
    quest.gate.type === 'microQuiz' ? quest.gate.questions.map(() => []) : [],
  questionMisses:
    quest.gate.type === 'microQuiz' ? quest.gate.questions.map(() => 0) : [],
  isWalletVerified: false,
  isWalletDetected: false,
});

export const isGatePassed = (
  quest: OnboardingQuest,
  state: QuestGateState,
): boolean => {
  if (quest.gate.type === 'quiz') {
    return state.picked === quest.gate.correctIndex;
  }
  if (quest.gate.type === 'wallet') {
    return state.isWalletVerified;
  }
  if (quest.gate.type === 'walletDetect') {
    return state.isWalletDetected;
  }
  if (quest.gate.type === 'microQuiz') {
    return quest.gate.questions.every(
      (question, index) => state.answers[index] === question.correctIndex,
    );
  }
  return (
    state.checks.length === quest.gate.items.length &&
    state.checks.every(Boolean)
  );
};

interface QuizOptionsProps {
  options: string[];
  picked: number | null;
  wrongPicks: number[];
  correctIndex: number;
  isLocked: boolean;
  onPick: (optionIndex: number) => void;
}

const QuizOptions = ({
  options,
  picked,
  wrongPicks,
  correctIndex,
  isLocked,
  onPick,
}: QuizOptionsProps) => (
  <div className="flex flex-col gap-2">
    {options.map((option, optionIndex) => {
      const isRight = picked === correctIndex && picked === optionIndex;
      const isRuledOut = wrongPicks.includes(optionIndex);
      return (
        <button
          key={optionIndex}
          type="button"
          disabled={isLocked || picked === correctIndex}
          onClick={() => onPick(optionIndex)}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors ${
            isRight
              ? 'border-accent bg-accent-light'
              : isRuledOut
              ? 'border-neutral-dark text-disabled line-through'
              : 'border-line/40 hover:border-accent'
          }`}
        >
          <span
            className={`mt-0.5 h-5 w-5 flex-none rounded-full border-2 ${
              isRight ? 'border-accent bg-accent' : 'border-line/40'
            }`}
            aria-hidden
          />
          <span>{option}</span>
        </button>
      );
    })}
  </div>
);

interface QuestGateProps {
  quest: OnboardingQuest;
  state: QuestGateState;
  walletStatus: WalletGateStatus;
  isClaimed: boolean;
  isClaiming: boolean;
  hasPendingCarrots: boolean;
  onPick: (optionIndex: number) => void;
  onPickQuestion: (questionIndex: number, optionIndex: number) => void;
  onToggleCheck: (itemIndex: number) => void;
  onClaim: () => void;
}

const QuestGate = ({
  quest,
  state,
  walletStatus,
  isClaimed,
  isClaiming,
  hasPendingCarrots,
  onPick,
  onPickQuestion,
  onToggleCheck,
  onClaim,
}: QuestGateProps) => {
  const t = useTranslations();
  const isPassed = isGatePassed(quest, state);
  const hasWrongPick =
    !isPassed &&
    (quest.gate.type === 'microQuiz'
      ? quest.gate.questions.some(
          (question, index) =>
            state.answers[index] !== null &&
            state.answers[index] !== question.correctIndex,
        )
      : state.wrongPicks.length > 0);

  return (
    <div className="mt-7 rounded-lg border border-line/40 p-5">
      <p className="mb-3.5 text-lg font-bold">{quest.gate.ask}</p>

      {quest.gate.type === 'wallet' ? (
        <WalletGate
          gate={quest.gate}
          status={walletStatus}
          isClaimed={isClaimed}
        />
      ) : quest.gate.type === 'walletDetect' ? (
        <div className="flex flex-col gap-3">
          <p
            className={`flex items-start gap-3 text-base ${
              state.isWalletDetected ? '' : 'text-complimentary-light'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 text-xs font-bold ${
                state.isWalletDetected
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-line/40'
              }`}
              aria-hidden
            >
              {state.isWalletDetected ? '✓' : ''}
            </span>
            <span>
              {state.isWalletDetected
                ? quest.gate.detect.detected
                : quest.gate.detect.waiting}
            </span>
          </p>
          {!state.isWalletDetected && (
            <ol className="flex flex-col gap-2 rounded-lg bg-accent-light/40 p-4 text-base">
              {quest.gate.detect.help.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent-core">
                    {itemIndex + 1}
                  </span>
                  <span>
                    <InlineText text={item} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : quest.gate.type === 'microQuiz' ? (
        <div className="flex flex-col gap-5">
          {quest.gate.questions.map((question, questionIndex) => {
            const picked = state.answers[questionIndex] ?? null;
            const isRight = picked === question.correctIndex;
            return (
              <div key={questionIndex} className="flex flex-col gap-2">
                <p className="text-base font-bold">
                  {questionIndex + 1}. {question.ask}
                </p>
                <QuizOptions
                  options={question.options}
                  picked={picked}
                  wrongPicks={state.questionWrongPicks[questionIndex] ?? []}
                  correctIndex={question.correctIndex}
                  isLocked={isClaimed}
                  onPick={(optionIndex) =>
                    onPickQuestion(questionIndex, optionIndex)
                  }
                />
                {isRight && (
                  <p className="text-sm font-bold text-accent">{question.ok}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : quest.gate.type === 'quiz' ? (
        <QuizOptions
          options={quest.gate.options}
          picked={state.picked}
          wrongPicks={state.wrongPicks}
          correctIndex={quest.gate.correctIndex}
          isLocked={isClaimed}
          onPick={onPick}
        />
      ) : (
        <div className="flex flex-col">
          {quest.gate.items.map((item, itemIndex) => (
            <label
              key={itemIndex}
              className="flex cursor-pointer items-start gap-3 py-2 text-base"
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 flex-shrink-0 accent-accent"
                checked={Boolean(state.checks[itemIndex])}
                disabled={isClaimed}
                onChange={() => onToggleCheck(itemIndex)}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
      )}

      {isPassed && (
        <p className="mt-3 text-base font-bold text-accent">{quest.gate.ok}</p>
      )}
      {hasWrongPick && (
        <p className="mt-3 text-base font-bold text-failure">
          {t('token_onboarding_quiz_wrong')}
        </p>
      )}

      {isClaimed ? (
        <p className="mt-5 text-center text-base font-bold text-success">
          {t('token_onboarding_claimed', {
            carrots: formatCarrots(quest.carrots),
          })}
          {hasPendingCarrots && (
            <span className="mt-1 block text-sm font-normal text-complimentary-light">
              {t('token_onboarding_carrots_pending')}
            </span>
          )}
        </p>
      ) : (
        <Button
          className="mt-5"
          isEnabled={isPassed}
          isLoading={isClaiming}
          onClick={onClaim}
        >
          {t('token_onboarding_claim', {
            carrots: formatCarrots(quest.carrots),
          })}
        </Button>
      )}
    </div>
  );
};

export default QuestGate;
