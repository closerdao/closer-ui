import { useTranslations } from 'next-intl';

import { OnboardingQuest } from '../../constants/tokenOnboardingQuests';
import { formatCarrots } from '../../utils/tokenOnboarding.helpers';
import Button from '../ui/Button';

export interface QuestGateState {
  /** Option the member last picked on a quiz gate. */
  picked: number | null;
  /** Options already ruled out, struck through so they read as spent. */
  wrongPicks: number[];
  /** One flag per item on a checklist gate. */
  checks: boolean[];
}

export const emptyGateState = (quest: OnboardingQuest): QuestGateState => ({
  picked: null,
  wrongPicks: [],
  checks:
    quest.gate.type === 'check' ? quest.gate.items.map(() => false) : [],
});

export const isGatePassed = (
  quest: OnboardingQuest,
  state: QuestGateState,
): boolean => {
  if (quest.gate.type === 'quiz') {
    return state.picked === quest.gate.correctIndex;
  }
  return (
    state.checks.length === quest.gate.items.length &&
    state.checks.every(Boolean)
  );
};

interface QuestGateProps {
  quest: OnboardingQuest;
  state: QuestGateState;
  isClaimed: boolean;
  isClaiming: boolean;
  hasPendingCarrots: boolean;
  onPick: (optionIndex: number) => void;
  onToggleCheck: (itemIndex: number) => void;
  onClaim: () => void;
}

const QuestGate = ({
  quest,
  state,
  isClaimed,
  isClaiming,
  hasPendingCarrots,
  onPick,
  onToggleCheck,
  onClaim,
}: QuestGateProps) => {
  const t = useTranslations();
  const isPassed = isGatePassed(quest, state);
  const hasWrongPick = state.wrongPicks.length > 0 && !isPassed;

  return (
    <div className="mt-7 rounded-lg border border-line/40 p-5">
      <p className="mb-3.5 text-lg font-bold">{quest.gate.ask}</p>

      {quest.gate.type === 'quiz' ? (
        <div className="flex flex-col gap-2">
          {quest.gate.options.map((option, optionIndex) => {
            const isRight = isPassed && state.picked === optionIndex;
            const isRuledOut = state.wrongPicks.includes(optionIndex);
            return (
              <button
                key={optionIndex}
                type="button"
                disabled={isClaimed || isPassed}
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
