import { useState } from 'react';

import { __, priceFormat } from '../utils/helpers';
import PlusIcon from './icons/PlusIcon';

export const PriceSelector = ({ fiatPrice, tokenPrice, utilityFiat }) => {
  const [currency, setCurrency] = useState('fiat');
  const isEuroSelected = currency === 'fiat';
  const isTokenSelected = currency === 'token';
  const activeClass =
    'flex-1 bg-black text-white rounded-3xl text-center uppercase text-xs h-full flex items-center justify-center';
  const inactiveClass =
    'flex-1 bg-white text-black text-center uppercase text-xs';
  return (
    <div>
      <div className="h-9 border border-solid border-neutral-400 rounded-3xl p-1 font-normal flex justify-between items-center">
        <button
          className={isEuroSelected ? activeClass : inactiveClass}
          onClick={() => setCurrency('fiat')}
        >
          {__('booking_accomodation_step_listing_card_euro_title')}
        </button>
        <button
          className={isTokenSelected ? activeClass : inactiveClass}
          onClick={() => setCurrency('token')}
        >
          {__('booking_accomodation_step_listing_card_token_title')}
        </button>
      </div>
      <div className="flex items-center justify-center mt-8">
        <div className="flex-1 flex flex-col items-center">
          <p className="text-2xl leading-9">
            {priceFormat(isTokenSelected ? tokenPrice : fiatPrice)}
          </p>
          <p>{__('booking_accomodation_step_listing_card_accomodation')}</p>
        </div>
        <div>
          <PlusIcon width={16} height={16} />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <p className="text-2xl leading-9">{priceFormat(utilityFiat)}</p>
          <p>{__('booking_accomodation_step_listing_card_utility')}</p>
        </div>
      </div>
    </div>
  );
};
