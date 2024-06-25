import { useTranslations } from 'next-intl';

import { CloserCurrencies, Price } from '../types';
import { getVatInfo, priceFormat } from '../utils/helpers';
import HeadingRow from './ui/HeadingRow';

interface Props {
  utilityFiat?: Price<CloserCurrencies>;
  accomodationCost?: Price<CloserCurrencies>;
  useTokens: boolean;
  useCredits: boolean;
  totalToken: Price<CloserCurrencies>;
  totalFiat: Price<CloserCurrencies>;
  eventCost?: Price<CloserCurrencies>;
  eventDefaultCost?: number;
  accomodationDefaultCost?: number;
  volunteerId?: string;
  foodOption?: string;
  isNotPaid?: boolean;
  updatedAccomodationTotal?: Price<CloserCurrencies>;
  isEditMode?: boolean;
  updatedUtilityTotal?: Price<CloserCurrencies>;
  updatedFiatTotal?: Price<CloserCurrencies>;
  updatedEventTotal?: Price<CloserCurrencies>;
}

const SummaryCosts = ({
  utilityFiat,
  accomodationCost,
  foodOption,
  useTokens,
  useCredits,
  totalToken,
  totalFiat,
  eventCost,
  eventDefaultCost,
  isNotPaid,
  updatedAccomodationTotal,
  isEditMode,
  updatedUtilityTotal,
  updatedFiatTotal,
  updatedEventTotal,
}: Props) => {
  const t = useTranslations();

  return (
    <div>
      <HeadingRow>
        <span className="mr-4">💰</span>
        <span>{t('bookings_summary_step_costs_title')}</span>
      </HeadingRow>

      {eventCost ? (
        <div className="flex justify-between items-center mt-3">
          <p>{t('bookings_checkout_event_cost')}</p>
          <div className="flex items-center gap-2">
            {isEditMode && updatedEventTotal?.val !== eventDefaultCost && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}: {priceFormat(updatedEventTotal)}
              </div>
            )}
            <p className="font-bold">
              {eventCost?.val !== 0 && eventDefaultCost !== eventCost?.val && (
                <span className="line-through">
                  {priceFormat(eventDefaultCost)}
                </span>
              )}{' '}
              {priceFormat(eventCost)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between items-center mt-3">
        <p>{t('bookings_summary_step_dates_accomodation_type')}</p>
        <div className="flex items-center gap-2">
          {isEditMode &&
            updatedAccomodationTotal?.val !== accomodationCost?.val && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}:{' '}
                {useCredits &&
                  priceFormat({
                    val: updatedAccomodationTotal?.val,
                    cur: 'credits',
                    creditSymbol: t('carrots_balance') + t('carrots_heading'),
                  })}
                {useTokens && priceFormat(updatedAccomodationTotal)}
                {!useTokens &&
                  !useCredits &&
                  priceFormat(updatedAccomodationTotal)}
              </div>
            )}

          <p className="font-bold">
            {useCredits &&
              priceFormat({
                val: totalToken.val,
                cur: 'credits',
                creditSymbol: t('carrots_balance') + t('carrots_heading'),
              })}
            {useTokens && priceFormat(totalToken)}
            {!useCredits && !useTokens && priceFormat(accomodationCost)}
            {isNotPaid && (
              <span className="text-failure"> {t('booking_card_unpaid')}</span>
            )}
          </p>
        </div>
      </div>
      <p className="text-right text-xs">
        {t('bookings_summary_step_accomodation_type_description')}
      </p>
      <div className="flex justify-between items-center mt-3">
        <p> {t('bookings_summary_step_utility_total')}</p>
        <div className="flex items-center gap-2">
          {isEditMode && updatedUtilityTotal?.val !== utilityFiat?.val && (
            <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
              {t('bookings_updated_price')}: {priceFormat(updatedUtilityTotal)}
            </div>
          )}
          <p className="font-bold">
            {foodOption === 'no_food'
              ? 'NOT INCLUDED'
              : priceFormat(utilityFiat)}
            {isNotPaid && (
              <span className="text-failure"> {t('booking_card_unpaid')}</span>
            )}
          </p>
        </div>
      </div>
      <p className="text-right text-xs">
        {t('bookings_summary_step_utility_description')}
      </p>
      <div className="flex justify-between items-center mt-3">
        <p>{t('bookings_total')}</p>
        <div className="flex items-center gap-2">
          {isEditMode &&
            (updatedFiatTotal?.val !== totalFiat?.val ||
              updatedAccomodationTotal?.val !== accomodationCost?.val) && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}:{' '}
                <span>
                  {useTokens && (
                    <div>
                      {priceFormat(updatedAccomodationTotal)} +{' '}
                      {priceFormat(updatedFiatTotal)}
                    </div>
                  )}
                  {useCredits && (
                    <div>
                      {priceFormat({
                        val: updatedAccomodationTotal?.val,
                        cur: 'credits',
                        creditSymbol:
                          t('carrots_balance') + t('carrots_heading'),
                      })}{' '}
                      + <span>{priceFormat(totalFiat)}</span>
                    </div>
                  )}
                  {!useTokens && !useCredits && priceFormat(updatedFiatTotal)}
                </span>
              </div>
            )}
          <div className="font-bold">
            {useTokens && (
              <>
                <span>{priceFormat(totalToken)}</span> +{' '}
                <span>{priceFormat(totalFiat)}</span>
                {isNotPaid && (
                  <span className="text-failure">
                    {' '}
                    {t('booking_card_unpaid')}
                  </span>
                )}
              </>
            )}
            {useCredits && (
              <>
                <span>
                  {priceFormat({
                    val: totalToken.val,
                    cur: 'credits',
                    creditSymbol: t('carrots_balance') + t('carrots_heading'),
                  })}
                </span>{' '}
                + <span>{priceFormat(totalFiat)}</span>
                {isNotPaid && (
                  <span className="text-failure">
                    {' '}
                    {t('booking_card_unpaid')}
                  </span>
                )}
              </>
            )}

            {!useTokens && !useCredits && (
              <div>
                {' '}
                {priceFormat(totalFiat)}
                {isNotPaid && (
                  <span className="text-failure">
                    {' '}
                    {t('booking_card_unpaid')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-right text-xs">
        {t('bookings_checkout_step_total_description')} {getVatInfo(totalFiat)}
      </p>
    </div>
  );
};

export default SummaryCosts;
