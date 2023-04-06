import { FC } from 'react';

import { CloserCurrencies } from '../../types';
import { __, priceFormat } from '../../utils/helpers';

type TicketOption = {
  name: string;
  price: number;
  currency: CloserCurrencies;
  available: number;
};

interface Props {
  items: TicketOption[];
  selectTicketName: (name: string) => void;
  selectedTicketName?: string;
}

const EventTicketOptions: FC<Props> = ({
  items,
  selectTicketName,
  selectedTicketName,
}) => {
  return (
    <div>
      <h2 className="mb-3 text-2xl leading-10 font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
        <span className="mr-1">🎟</span>
        <span>{__('bookings_dates_step_tickets_title')}</span>
      </h2>
      <div className="ticket-options my-4 flex flex-row flex-wrap">
        {items.map((option) => (
          <button
            key={option.name}
            className={`border-2 flex flex-col justify-center rounded-md shadow-lg mr-3 mb-3 p-4 hover:border-accent ${
              option.name === selectedTicketName
                ? 'border-accent'
                : 'border-gray-100'
            } ${option.available > 0 ? 'available' : 'unavailable'}`}
            onClick={() => selectTicketName(option.name)}
            disabled={option.available === 0}
          >
            <h4>{option.name.split('_').join(' ')}</h4>
            <p className="price text-gray-500">
              {priceFormat(option.price, option.currency)}
            </p>
            <p className="availability text-xs uppercase text-accent">
              {option.available > 0
                ? `${option.available} available`
                : 'not available'}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EventTicketOptions;
