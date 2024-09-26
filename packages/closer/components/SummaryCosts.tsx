import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import { CloserCurrencies, Price } from '../types';
import { getVatInfo, priceFormat } from '../utils/helpers';
import HeadingRow from './ui/HeadingRow';

interface Props {
  rentalFiat?: Price<CloserCurrencies>;
  utilityFiat?: Price<CloserCurrencies>;
  foodFiat?: Price<CloserCurrencies>;
  accomodationCost?: Price<CloserCurrencies>;
  useTokens: boolean;
  useCredits: boolean;
  totalToken: Price<CloserCurrencies>;
  totalFiat: Price<CloserCurrencies>;
  eventCost?: Price<CloserCurrencies>;
  eventDefaultCost?: number;
  accomodationDefaultCost?: number;
  volunteerId?: string;
  isNotPaid?: boolean;
  updatedAccomodationTotal?: Price<CloserCurrencies>;
  isEditMode?: boolean;
  updatedUtilityTotal?: Price<CloserCurrencies>;
  updatedFoodTotal?: Price<CloserCurrencies>;
  updatedFiatTotal?: Price<CloserCurrencies>;
  updatedEventTotal?: Price<CloserCurrencies>;
  priceDuration?: string;
  vatRate?: number;
  isFoodIncluded: boolean;
}

const SummaryCosts = ({
  rentalFiat,
  utilityFiat,
  foodFiat,
  accomodationCost,
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
  updatedFoodTotal,
  updatedFiatTotal,
  updatedEventTotal,
  priceDuration,
  vatRate,
  isFoodIncluded,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  const isPartialCreditsPayment = Boolean(rentalFiat?.val && totalToken.val);

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
            {isEditMode && updatedEventTotal?.val !== eventCost?.val && (
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
              {isNotPaid && (
                <span className="text-failure">
                  {' '}
                  {t('booking_card_unpaid')}
                </span>
              )}
            </p>
          </div>
        </div>
      ) : null}

      {priceDuration === 'night' && (
        <>
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
                      })}
                    {useTokens &&
                      priceFormat({
                        val: updatedAccomodationTotal?.val,
                        cur: updatedAccomodationTotal?.cur,
                      })}
                    {!useTokens &&
                      !useCredits &&
                      priceFormat({
                        val: updatedAccomodationTotal?.val,
                        cur: updatedAccomodationTotal?.cur,
                      })}
                  </div>
                )}

              <div className="font-bold">
                <>
                  {useTokens && <>{priceFormat(accomodationCost)}</>}
                  {useCredits && (
                    <>
                      {isPartialCreditsPayment && (
                        <div>
                          {priceFormat({
                            val: accomodationCost?.val,
                            cur: 'credits',
                            app: APP_NAME,
                          })}
                          {' + '}
                          {priceFormat({
                            val: rentalFiat?.val,
                            cur: rentalFiat?.cur,
                            app: APP_NAME,
                          })}
                        </div>
                      )}
                      {!isPartialCreditsPayment &&
                        priceFormat({
                          val: accomodationCost?.val,
                          cur: 'credits',
                          app: APP_NAME,
                        })}
                    </>
                  )}
                </>
                {!useTokens && !useCredits && priceFormat(accomodationCost)}

                {isNotPaid && (
                  <span className="text-failure">
                    {' '}
                    {t('booking_card_unpaid')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-right text-xs">
            {t('bookings_summary_step_accomodation_type_description')}
          </p>

          {utilityFiat?.val ? (
            <div>
              <div className="flex justify-between items-center mt-3">
                <p> {t('bookings_summary_step_utility_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode &&
                    updatedUtilityTotal?.val !== utilityFiat?.val && (
                      <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                        {t('bookings_updated_price')}:{' '}
                        {priceFormat(updatedUtilityTotal)}
                      </div>
                    )}

                  <p className="font-bold">
                    {priceFormat(utilityFiat)}
                    {isNotPaid && (
                      <span className="text-failure">
                        {' '}
                        {t('booking_card_unpaid')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-right text-xs">
                {t('bookings_summary_step_utility_description')}
              </p>
            </div>
          ) : null}

          {foodFiat?.val ? (
            <div>
              <div className="flex justify-between items-center mt-3">
                <p> {t('bookings_summary_step_food_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode && updatedFoodTotal?.val !== foodFiat?.val && (
                    <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                      {t('bookings_updated_price')}:{' '}
                      {priceFormat(updatedFoodTotal)}
                    </div>
                  )}
                  <p className="font-bold">
                    {isFoodIncluded
                      ? priceFormat(foodFiat.val)
                      : 'NOT INCLUDED'}
                    {isNotPaid && (
                      <span className="text-failure">
                        {' '}
                        {t('booking_card_unpaid')}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-right text-xs">
                {t('bookings_summary_step_utility_description')}
              </p>
            </div>
          ) : null}
        </>
      )}
      <div className="flex justify-between items-center mt-3">
        <p>{t('bookings_total')}</p>
        <div className="flex items-center gap-2">
          {isEditMode &&
            (updatedFiatTotal?.val !== totalFiat?.val ||
              updatedAccomodationTotal?.val !== accomodationCost?.val) && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}:{' '}
                {priceDuration === 'night' && (
                  <div>
                    {useTokens && (
                      <div>{priceFormat(updatedAccomodationTotal)}</div>
                    )}
                    {useCredits && (
                      <div>
                        {priceFormat({
                          val: updatedAccomodationTotal?.val,
                          cur: 'credits',
                          app: APP_NAME,
                        })}{' '}
                        +{priceFormat(updatedFiatTotal)}
                      </div>
                    )}
                    {!useTokens && !useCredits && priceFormat(updatedFiatTotal)}
                  </div>
                )}
                {priceDuration === 'hour' && (
                  <div>
                    {useTokens && (
                      <div>{priceFormat(updatedAccomodationTotal)}</div>
                    )}

                    {useCredits && (
                      <div>
                        {priceFormat({
                          val: updatedAccomodationTotal?.val,
                          cur: 'credits',
                          app: APP_NAME,
                        })}
                      </div>
                    )}
                    {!useTokens && !useCredits && priceFormat(updatedFiatTotal)}
                  </div>
                )}
              </div>
            )}

          {(priceDuration === 'night' || !priceDuration) && (
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
                      app: APP_NAME,
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
          )}

          {priceDuration === 'hour' && (
            <div className="font-bold">
              {useTokens && (
                <>
                  <span>{priceFormat(totalToken)}</span>
                </>
              )}
              {useCredits && (
                <>
                  <span>
                    {priceFormat({
                      val: totalToken.val,
                      cur: 'credits',
                      app: APP_NAME,
                    })}
                  </span>
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
          )}
        </div>
      </div>
      <p className="text-right text-xs">
        {t('bookings_checkout_step_total_description')}{' '}
        {getVatInfo(totalFiat, vatRate)}
      </p>
    </div>
  );
};

export default SummaryCosts;
