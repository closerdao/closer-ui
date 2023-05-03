import { CloserCurrencies, Price } from '../types';
import { __, getVatInfo, priceFormat } from '../utils/helpers';
import HeadingRow from './ui/HeadingRow';

interface Props {
  utilityFiat?: Price<CloserCurrencies>;
  accomodationCost?: Price<CloserCurrencies>;
  useTokens: boolean;
  totalToken: Price<CloserCurrencies>;
  totalFiat: Price<CloserCurrencies>;
  eventCost?: Price<CloserCurrencies>;
  eventDefaultCost?: number;
  accomodationDefaultCost?: number;
  volunteerId?: string;
}

const SummaryCosts = ({
  utilityFiat,
  accomodationCost,
  useTokens,
  totalToken,
  totalFiat,
  eventCost,
  eventDefaultCost
}: Props) => {
  return (
    <div>
      <HeadingRow>
        <span className="mr-4">💰</span>
        <span>{__('bookings_summary_step_costs_title')}</span>
      </HeadingRow>

      {eventCost ? (
        <div className="flex justify-between items-center mt-3">
          <p>{__('bookings_checkout_event_cost')}</p>
          <p className="font-bold">
            {eventDefaultCost !== eventCost?.val && (
              <span className="line-through">
                {priceFormat(eventDefaultCost)}
              </span>
            )}{' '}
            {priceFormat(eventCost)}
          </p>
        </div>
      ) : null}

      <div className="flex justify-between items-center mt-3">
        <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
        <p className="font-bold">
          {priceFormat(accomodationCost)}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_summary_step_accomodation_type_description')}
      </p>
      <div className="flex justify-between items-center mt-3">
        <p> {__('bookings_summary_step_utility_total')}</p>
        <p className="font-bold">{priceFormat(utilityFiat)}</p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_summary_step_utility_description')}
      </p>
      <div className="flex justify-between items-center mt-3">
        <p>{__('bookings_total')}</p>
        <p className="font-bold">
          {useTokens ? (
            <>
              <span>
                {priceFormat(totalToken)}
              </span>{' '}
              + <span>{priceFormat(totalFiat)}</span>
            </>
          ) : (
            priceFormat(totalFiat)
          )}
        </p>
      </div>
      <p className="text-right text-xs">
        {__('bookings_checkout_step_total_description')} {getVatInfo(totalFiat)}
      </p>
    </div>
  );
};

export default SummaryCosts;
