import { DEFAULT_CURRENCY } from '../constants';
import { useConfig } from '../hooks/useConfig';
import { CloserCurrencies, Price } from '../types';
import { __, getVatInfo, priceFormat } from '../utils/helpers';

interface Props {
  utilityFiat?: Price<
    CloserCurrencies.EUR | CloserCurrencies.TDF | CloserCurrencies.ETH
  >;
  accomodationCost?: number;
  useTokens: boolean;
  totalToken: number;
  totalFiat: Price<CloserCurrencies>;
  eventCost?: number;
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
  eventDefaultCost,
  accomodationDefaultCost,
  volunteerId,
}: Props) => {
  const { BLOCKCHAIN_DAO_TOKEN }: any = useConfig();

  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2 mb-3">
        <span className="mr-1">💰</span>
        <span>{__('bookings_summary_step_costs_title')}</span>
      </h2>

      {eventCost ? (
        <div className="flex justify-between items-center mt-3">
          <p>{__('bookings_checkout_event_cost')}</p>
          <p className="font-bold">
            {eventDefaultCost !== eventCost && (
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
          {volunteerId ? (
            <span className="line-through">
              {priceFormat(accomodationDefaultCost)}
            </span>
          ) : null}{' '}
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
                {priceFormat(totalToken, BLOCKCHAIN_DAO_TOKEN.symbol)}
              </span>{' '}
              + <span>{priceFormat(totalFiat)}</span>
            </>
          ) : (
            priceFormat(totalFiat, DEFAULT_CURRENCY)
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
