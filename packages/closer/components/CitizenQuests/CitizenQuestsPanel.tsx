import { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import type { CitizenQuestsState } from '../../hooks/useCitizenQuests';
import CitizenGoodToBuy from '../CitizenGoodToBuy';
import CitizenQuests from './index';

interface Props {
  quests: CitizenQuestsState;
  /** Hide the Presence/Vouching quests (e.g. for people who are already citizens). */
  showEligibilityQuests?: boolean;
  /**
   * When true the tokens quest lets people pick a token intent (buy / finance).
   * The page editor block renders a read-only summary instead, since the intent
   * is only actionable inside the application flow.
   */
  interactive?: boolean;
  /**
   * Rendered at the bottom of the tokens quest, so the action that follows from
   * picking a token intent sits with the choice instead of below the fold.
   */
  tokensAction?: ReactNode;
}

/**
 * The citizenship quests wired to `useCitizenQuests`, so the same cards can be
 * dropped into the application flow, a page editor block, or anywhere else.
 */
const CitizenQuestsPanel = ({
  quests,
  showEligibilityQuests = true,
  interactive = true,
  tokensAction,
}: Props) => {
  const t = useTranslations();

  const {
    hasStayedForMinDuration,
    totalStayDays,
    minStayDuration,
    presenceProgress,
    isTokensComplete,
    isVouched,
    vouchCount,
    minVouches,
    isSpaceHostVouchRequired,
    tokensProgress,
    tokensRequired,
    balanceTotal,
    ownsRequiredTokens,
    hasLiveWalletBalances: hasConfirmedBalance,
    application,
    updateApplication,
  } = quests;

  // Once we can see the required tokens on the user's own wallet there is
  // nothing left to buy or finance, so the quest just reports success.
  const hasCompletedTokensQuest = hasConfirmedBalance && ownsRequiredTokens;

  return (
    <CitizenQuests
      hasStayedForMinDuration={hasStayedForMinDuration}
      totalStayDays={totalStayDays}
      minStayDuration={minStayDuration}
      presenceProgress={presenceProgress}
      isTokensComplete={isTokensComplete}
      isVouched={isVouched}
      vouchCount={vouchCount}
      minVouches={minVouches}
      isSpaceHostVouchRequired={isSpaceHostVouchRequired}
      tokensProgress={tokensProgress}
      showEligibilityQuests={showEligibilityQuests}
      tokensCard={
        <>
          {hasConfirmedBalance && (
            <p className="mb-3 text-sm font-bold">
              {t('subscriptions_citizen_you_hold', { var: balanceTotal })}
            </p>
          )}
          {hasCompletedTokensQuest ? (
            <p className="text-sm font-bold text-accent">
              ✓ {t('subscriptions_citizen_quest_complete')}
            </p>
          ) : interactive ? (
            <CitizenGoodToBuy
              updateApplication={updateApplication}
              application={application}
              balanceTotal={balanceTotal}
              tokensRequired={tokensRequired}
            />
          ) : (
            <p className="text-sm text-gray-600">
              {t('subscriptions_citizen_tokens_progress', {
                balance: hasConfirmedBalance ? balanceTotal : 0,
                required: tokensRequired,
              })}
            </p>
          )}
          {tokensAction && <div className="mt-4">{tokensAction}</div>}
        </>
      }
    />
  );
};

export default CitizenQuestsPanel;
