import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import { priceFormat } from '../../utils/helpers';
import { Button, Card, Heading } from '../ui';

const DEMO_NIGHTS = 3;
const DEMO_NIGHTLY_RATE = 45;
const DEMO_UTILITY_TOTAL = 24;

interface Props {
  /** Credits the member actually holds, so the demo can use their number. */
  creditsBalance?: number;
  className?: string;
}

/**
 * A worked example of the thing credits are for: a stay, its accommodation
 * line, and that line going to zero when credits are applied.
 *
 * It used to be the bare `RedeemCredits` card with `isDemo`, which showed the
 * widget but not what it does — members read "1 credit = 1 night" without
 * seeing which part of a booking the night comes off. Utilities stay payable
 * in fiat here because that is how the real checkout behaves.
 */
const CreditsDemo = ({ creditsBalance = 0, className }: Props) => {
  const t = useTranslations();
  const [hasApplied, setHasApplied] = useState(false);

  const accommodationTotal = DEMO_NIGHTS * DEMO_NIGHTLY_RATE;
  const creditsUsed = DEMO_NIGHTS;
  const accommodationDue = hasApplied ? 0 : accommodationTotal;
  const total = accommodationDue + DEMO_UTILITY_TOTAL;
  const balanceAfter = Math.max(0, creditsBalance - creditsUsed);

  return (
    <div className={className}>
      <Heading level={4} className="mb-4">
        {t('credits_demo_heading')}
      </Heading>

      <Card className="gap-0 p-0 overflow-hidden">
        <div className="bg-accent-light px-4 py-3">
          <div className="font-bold">{t('credits_demo_listing_title')}</div>
          <div className="text-sm text-gray-700">
            {t('credits_demo_listing_dates', { nights: DEMO_NIGHTS })}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span>
              {t('credits_demo_accommodation_row', {
                nights: DEMO_NIGHTS,
                rate: priceFormat(DEMO_NIGHTLY_RATE, DEFAULT_CURRENCY),
              })}
            </span>
            <span
              className={
                hasApplied ? 'line-through text-gray-400' : 'font-medium'
              }
            >
              {priceFormat(accommodationTotal, DEFAULT_CURRENCY)}
            </span>
          </div>

          {hasApplied && (
            <div className="flex justify-between text-system-success font-medium">
              <span>{t('credits_demo_credits_row', { credits: creditsUsed })}</span>
              <span>−{priceFormat(accommodationTotal, DEFAULT_CURRENCY)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>{t('credits_demo_utility_row')}</span>
            <span className="font-medium">
              {priceFormat(DEMO_UTILITY_TOTAL, DEFAULT_CURRENCY)}
            </span>
          </div>

          <div className="flex justify-between border-t pt-2 font-bold">
            <span>{t('bookings_checkout_step_total_title')}</span>
            <span>{priceFormat(total, DEFAULT_CURRENCY)}</span>
          </div>
        </div>

        <div className="border-t p-4 flex flex-col gap-3 text-center">
          {hasApplied ? (
            <>
              <p className="text-system-success font-bold">
                {t('credits_demo_applied', {
                  credits: creditsUsed,
                  nights: DEMO_NIGHTS,
                })}
              </p>
              <p className="text-xs text-gray-600">
                {t('credits_demo_balance_after', { balance: balanceAfter })}
              </p>
              <Button
                variant="secondary"
                size="small"
                isFullWidth={false}
                className="!normal-case tracking-normal mx-auto"
                onClick={() => setHasApplied(false)}
              >
                {t('credits_demo_reset')}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">
                {t('credits_demo_prompt', { credits: creditsUsed })}
              </p>
              <Button onClick={() => setHasApplied(true)}>
                {t('carrots_button_apply_discount')}
              </Button>
            </>
          )}
        </div>
      </Card>

      <p className="text-xs text-gray-500 mt-2">{t('credits_demo_footnote')}</p>
    </div>
  );
};

export default CreditsDemo;
