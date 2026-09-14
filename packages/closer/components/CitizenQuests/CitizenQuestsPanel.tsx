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
    hasNoReports,
    vouchCount,
    minVouches,
    isSpaceHostVouchRequired,
    tokensProgress,
    tokensRequired,
    tokenBalance,
    ownsRequiredTokens,
    isTokensCoveredByFinancePlan,
    hasLiveWalletBalances: hasConfirmedBalance,
    application,
    updateApplication,
  } = quests;

  // Once the required tokens are there — held, or covered by an active financed
  // plan — there is nothing left to buy or finance, so the quest just reports
  // success. `ownsRequiredTokens` is already judged on the balance the API would
  // use, so re-checking `hasConfirmedBalance` here only made the card disagree
  // with the apply button for anyone reading off the cached snapshot.
  const hasCompletedTokensQuest =
    ownsRequiredTokens || isTokensCoveredByFinancePlan;

  return (
    <CitizenQuests
      hasStayedForMinDuration={hasStayedForMinDuration}
      totalStayDays={totalStayDays}
      minStayDuration={minStayDuration}
      presenceProgress={presenceProgress}
      isTokensComplete={isTokensComplete}
      isVouched={isVouched}
      hasNoReports={hasNoReports}
      vouchCount={vouchCount}
      minVouches={minVouches}
      isSpaceHostVouchRequired={isSpaceHostVouchRequired}
      tokensProgress={tokensProgress}
      showEligibilityQuests={showEligibilityQuests}
      tokensCard={
        <>
          <p className="mb-1 text-sm font-bold">
            {t('subscriptions_citizen_you_hold', { var: tokenBalance })}
          </p>
          {!hasConfirmedBalance && (
            <p className="mb-3 text-xs text-gray-500">
              {t('citizenship_status_balances_cached_note')}
            </p>
          )}
          {hasCompletedTokensQuest ? (
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-accent">
                ✓ {t('subscriptions_citizen_quest_complete')}
              </p>
              {isTokensCoveredByFinancePlan && !ownsRequiredTokens && (
                <p className="text-sm text-gray-600">
                  {t('subscriptions_citizen_tokens_covered_by_plan')}
                </p>
              )}
            </div>
          ) : interactive ? (
            <CitizenGoodToBuy
              updateApplication={updateApplication}
              application={application}
              buyMore={ownsRequiredTokens}
              balanceTotal={tokenBalance}
              tokensRequired={tokensRequired}
            />
          ) : (
            <p className="text-sm text-gray-600">
              {t('subscriptions_citizen_tokens_progress', {
                balance: tokenBalance,
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
