import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import { CloserCurrencies, Price } from '../types';
import {
  getBookingPaymentType,
  getDisplayTotalFromComponents,
} from '../utils/booking.helpers';
import { getVatInfo, priceFormat } from '../utils/helpers';
import DisplayPrice from './DisplayPrice';
import HeadingRow from './ui/HeadingRow';

interface Props {
  rentalFiat?: Price<CloserCurrencies>;
  rentalToken?: Price<CloserCurrencies>;
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
  creditsPrice?: number;
  updatedRentalFiat?: Price<CloserCurrencies>;
  updatedRentalToken?: Price<CloserCurrencies>;
  status?: string;
  foodOptionEnabled?: boolean;
  utilityOptionEnabled?: boolean;
}

const SummaryCosts = ({
  rentalFiat,
  rentalToken,
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
  creditsPrice,
  updatedRentalFiat,
  updatedRentalToken,
  status,
  foodOptionEnabled,
  utilityOptionEnabled,
}: Props) => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();

  const paymentType = getBookingPaymentType({
    useCredits,
    useTokens,
    rentalFiat,
  });

  const calculatedTotalFiat = getDisplayTotalFromComponents({
    rentalFiat,
    utilityFiat,
    foodFiat,
    eventFiat: eventCost,
    fallbackCur: totalFiat?.cur ?? CloserCurrencies.EUR,
    foodOptionEnabled,
    utilityOptionEnabled,
  });

  const displayTotalFiat =
    totalFiat?.val != null && totalFiat?.cur
      ? totalFiat
      : calculatedTotalFiat;

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
            {isEditMode &&
              updatedEventTotal?.val !== eventCost?.val &&
              status !== 'cancelled' && (
                <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                  {t('bookings_updated_price')}:{' '}
                  {priceFormat(updatedEventTotal)}
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

      {(priceDuration === 'night' || !priceDuration) && (
        <>
          <div className="flex justify-between items-center mt-3">
            <p>{t('bookings_summary_step_dates_accomodation_type')}</p>

            <div className="flex items-center gap-2">
              {isEditMode &&
                (updatedRentalFiat?.val !== rentalFiat?.val ||
                  updatedRentalToken?.val.toFixed(2) !==
                    rentalToken?.val.toFixed(2)) &&
                status !== 'cancelled' && (
                  <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                    {t('bookings_updated_price')}:{' '}
                    <DisplayPrice
                      paymentType={paymentType}
                      isEditMode={true}
                      rentalFiat={updatedRentalFiat}
                      rentalToken={updatedRentalToken}
                      totalFiat={updatedFiatTotal}
                      isAccommodationPrice={true}
                    />
                  </div>
                )}

              <div className="font-bold">
                <DisplayPrice
                  paymentType={paymentType}
                  isEditMode={false}
                  rentalFiat={rentalFiat}
                  rentalToken={rentalToken}
                  isAccommodationPrice={true}
                />

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

          {utilityOptionEnabled ? (
            <div>
              <div className="flex justify-between items-center mt-3">
                <p> {t('bookings_summary_step_utility_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode &&
                    status !== 'cancelled' &&
                    updatedUtilityTotal?.val !== utilityFiat?.val && (
                      <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                        {t('bookings_updated_price')}:{' '}
                        {priceFormat(updatedUtilityTotal)}
                      </div>
                    )}

                  <p className="font-bold">
                    {priceFormat(
                      utilityFiat ?? {
                        val: 0,
                        cur: totalFiat?.cur ?? CloserCurrencies.EUR,
                      },
                    )}
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

          {foodOptionEnabled ? (
            <div>
              <div className="flex justify-between items-center mt-3">
                <p> {t('bookings_summary_step_food_total')}</p>
                <div className="flex items-center gap-2">
                  {isEditMode &&
                    updatedFoodTotal?.val !== foodFiat?.val &&
                    status !== 'cancelled' && (
                      <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                        {t('bookings_updated_price')}:{' '}
                        {priceFormat(updatedFoodTotal)}
                      </div>
                    )}
                  <p className="font-bold">
                    {isFoodIncluded
                      ? priceFormat(
                          foodFiat ?? {
                            val: 0,
                            cur: totalFiat?.cur ?? CloserCurrencies.EUR,
                          },
                        )
                      : t('stay_food_not_included')}
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
            status !== 'cancelled' &&
            (updatedFiatTotal?.val !== totalFiat?.val ||
              updatedAccomodationTotal?.val !== accomodationCost?.val) && (
              <div className="bg-accent-light px-2 py-1 rounded-md font-bold">
                {t('bookings_updated_price')}:{' '}
                {priceDuration === 'night' && (
                  <div>
                    <DisplayPrice
                      paymentType={paymentType}
                      isEditMode={true}
                      rentalFiat={updatedRentalFiat}
                      rentalToken={updatedRentalToken}
                      totalFiat={updatedFiatTotal}
                      isTotalPrice={true}
                    />
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
                  <span>
                    {priceFormat(
                      totalToken ?? {
                        val: 0,
                        cur: CloserCurrencies.TDF,
                      },
                    )}
                  </span>
                  {displayTotalFiat.val > 0 && (
                    <>
                      {' '}
                      + <span>{priceFormat(displayTotalFiat)}</span>
                    </>
                  )}
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
                      val: creditsPrice || totalToken?.val,
                      cur: 'credits',
                      app: APP_NAME,
                    })}
                  </span>{' '}
                  + <span>{priceFormat(displayTotalFiat)}</span>
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
                  {priceFormat(displayTotalFiat)}
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
                  <span>
                    {priceFormat(
                      totalToken ?? {
                        val: 0,
                        cur: CloserCurrencies.TDF,
                      },
                    )}
                  </span>
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
                  {priceFormat(displayTotalFiat)}
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
        {getVatInfo(displayTotalFiat, vatRate)}
      </p>
    </div>
  );
};

export default SummaryCosts;
