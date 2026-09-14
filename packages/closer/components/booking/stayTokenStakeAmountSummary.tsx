import { BigNumber } from 'ethers';
import { useFormatter, useTranslations } from 'next-intl';

import {
  tokenAmountNumberFromWei,
  useTokenAmountFormatter,
} from '../../hooks/useTokenAmountFormatter';
import type { PriceLock, StayTokenStakePlan } from '../../types/stay';

export type StayTokenStakeAmountSummaryProps = {
  priceLock: PriceLock | undefined;
  stakePlan: StayTokenStakePlan;
  tokensOwed: number;
};

const weiValuesEqual = (first: string, second: string): boolean => {
  try {
    return BigNumber.from(first).eq(BigNumber.from(second));
  } catch {
    return false;
  }
};

export function StayTokenStakeAmountSummary({
  priceLock,
  stakePlan,
  tokensOwed,
}: StayTokenStakeAmountSummaryProps) {
  const t = useTranslations();
  const format = useFormatter();
  const formatTokenAmount = useTokenAmountFormatter(stakePlan.displayDecimals);
  const total = tokenAmountNumberFromWei(
    stakePlan.totalWei,
    stakePlan.decimals,
  );
  const formattedTotal = formatTokenAmount(total ?? stakePlan.tokenAmount);
  const discount = priceLock?.accommodationDiscount;
  const durationDiscount = Number(discount?.duration.fraction) || 0;
  const passportDiscount = Number(discount?.passport.fraction) || 0;
  const combinedDiscount = Number(discount?.combinedFraction) || 0;
  const percent = (fraction: number) =>
    format.number(fraction * 100, { maximumFractionDigits: 2 });
  const rate = discount?.duration.tier;
  const tokenPricing = priceLock?.accommodationPricing?.token;
  const isFullDiscountedAccommodationStake = Boolean(
    combinedDiscount > 0 &&
      tokenPricing?.discountedWei &&
      weiValuesEqual(stakePlan.totalWei, tokenPricing.discountedWei),
  );
  const grossTotal =
    isFullDiscountedAccommodationStake && tokenPricing?.grossWei
      ? tokenAmountNumberFromWei(tokenPricing.grossWei, stakePlan.decimals)
      : null;
  const formattedGrossTotal =
    grossTotal != null && total != null && grossTotal > total
      ? formatTokenAmount(grossTotal)
      : null;

  return (
    <div className="flex flex-col gap-1 text-sm">
      <p className="text-gray-900">
        {formattedGrossTotal && (
          <span className="text-gray-400 line-through font-normal mr-1.5 tabular-nums">
            {formattedGrossTotal} $TDF
          </span>
        )}
        <span className="font-semibold tabular-nums">
          {formattedTotal} $TDF
        </span>
        <span className="text-gray-600 font-normal">
          {' '}
          {t('stay_create_listing_for_nights', {
            nights: stakePlan.bookingNights.length,
          })}
        </span>
      </p>
      {tokensOwed > 0 &&
        Math.abs(tokensOwed - stakePlan.tokenAmount) > 0.001 && (
          <p className="text-gray-700">
            {t('stay_create_stake_modal_tokens_owed_vs_on_chain', {
              owed: formatTokenAmount(tokensOwed),
              onChain: formattedTotal,
            })}
          </p>
        )}
      {(durationDiscount > 0 || passportDiscount > 0) && (
        <div className="text-xs font-medium text-accent flex flex-wrap gap-x-2">
          {durationDiscount > 0 && rate && (
            <span>
              {t('stay_create_duration_discount_badge', {
                rate: t(`stay_create_discount_rate_${rate}`),
                percent: percent(durationDiscount),
              })}
            </span>
          )}
          {passportDiscount > 0 && (
            <span>
              {t('stay_accommodation_discount_passport', {
                percent: percent(passportDiscount),
              })}
            </span>
          )}
          {durationDiscount > 0 && passportDiscount > 0 && (
            <span>
              {t('stay_accommodation_discount_combined', {
                percent: percent(combinedDiscount),
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
