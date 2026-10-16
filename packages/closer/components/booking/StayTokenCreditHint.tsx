import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { useStayCreditsEligibility } from '../../hooks/useStayCreditsEligibility';
import type { Stay } from '../../types/stay';
import {
  canChangeStayPaymentMethod,
  canShowStayTokenCreditPaymentOptions,
  getStayAccommodationTokenTotal,
  inferPaymentChoiceFromStay,
  isStayAwaitingHostApproval,
  isStayCheckoutDraft,
  isVolunteerStay,
} from '../../utils/stays.api';
import { Information } from '../ui';

export type StayTokenCreditHintTiming = 'available' | 'after-confirmation';

/**
 * Whether credits/tokens could pay this stay's accommodation, and when the
 * payment page will offer them. The controls themselves live only on the
 * payment page; this only tells the guest before they get there.
 */
export const getStayTokenCreditHintTiming = (
  stay: Stay,
  isMember: boolean,
): StayTokenCreditHintTiming | null => {
  if (stay.residencyAgreementId || isVolunteerStay(stay)) return null;
  const tokenAccommodationVal = getStayAccommodationTokenTotal(stay);
  if (tokenAccommodationVal <= 0) return null;
  if (
    stay.useTokens ||
    inferPaymentChoiceFromStay(stay, tokenAccommodationVal) !== 'fiat'
  )
    return null;
  // Non-members are offered credits/tokens only once the stay is confirmed.
  if (
    isStayAwaitingHostApproval(stay) ||
    (isStayCheckoutDraft(stay) && !isMember)
  )
    return 'after-confirmation';
  if (
    canShowStayTokenCreditPaymentOptions(stay, isMember) &&
    canChangeStayPaymentMethod(stay)
  )
    return 'available';
  return null;
};

type Props = {
  stay: Stay;
  isMember: boolean;
  className?: string;
};

export function StayTokenCreditHint({ stay, isMember, className }: Props) {
  const t = useTranslations();
  const { BLOCKCHAIN_DAO_TOKEN } = useConfig() || {};
  const timing = getStayTokenCreditHintTiming(stay, isMember);
  const { creditsBalance, canApplyCreditsAtStart } = useStayCreditsEligibility(
    timing ? stay : null,
  );
  if (!timing) return null;

  const hasCredits = creditsBalance > 0 && canApplyCreditsAtStart;
  const hasTokens = process.env.NEXT_PUBLIC_FEATURE_WEB3_BOOKING === 'true';
  if (!hasCredits && !hasTokens) return null;

  const suffix = timing === 'after-confirmation' ? '_after_confirmation' : '';
  const params = {
    credits: Number(creditsBalance.toFixed(2)),
    currency: BLOCKCHAIN_DAO_TOKEN?.symbol || 'TDF',
  };
  const message =
    hasCredits && hasTokens
      ? t(`stay_token_credit_hint_credits_tokens${suffix}`, params)
      : hasCredits
        ? t(`stay_token_credit_hint_credits${suffix}`, params)
        : t(`stay_token_credit_hint_tokens${suffix}`, params);

  return (
    <div data-testid="stay-token-credit-hint" className={className}>
      <Information>{message}</Information>
    </div>
  );
}
