import { Dispatch, FC, SetStateAction, useEffect } from 'react';

import {
  CloserCurrencies,
  TicketOption,
  VolunteerOpportunity,
} from '../../types';
import { __, priceFormat } from '../../utils/helpers';
import DiscountCode from '../DiscountCode';
import HeadingRow from '../ui/HeadingRow';

interface Props {
  items?: TicketOption[];
  selectTicketOption: (ticket: object) => void;
  // selectedTicketOption?: object;
  selectedTicketOption?: any;
  disclaimer?: string;
  volunteer?: VolunteerOpportunity;
  discountCode?: string;
  setDiscountCode: Dispatch<SetStateAction<string>>;
}

const Ticket = ({
  name,
  price,
  currency,
  disclaimer,
  available,
  selectTicketOption,
  selectedTicketOption,
  isVolunteer,
  isDayTicket,
}: {
  name: string;
  price?: number;
  currency?: string;
  disclaimer?: string;
  available: number;
  selectTicketOption: (ticket: object) => void;
  selectedTicketOption?: TicketOption;
  isVolunteer?: boolean;
  isDayTicket?: boolean;
  }) => (
  <button
    className={`border-2 flex flex-col justify-center rounded-md shadow-lg mr-3 mb-3 p-4 hover:border-accent ${
      name === selectedTicketOption?.name ? 'border-accent' : 'border-gray-100'
    } ${available > 0 ? 'available' : 'unavailable'}`}
    onClick={() => selectTicketOption({ name, isDayTicket, price, currency, disclaimer })}
    disabled={available === 0}
  >
    <h4 title={ disclaimer }>{name.split('_').join(' ')}</h4>
    { isDayTicket ?
      <p className="text-gray-500 italic">Day ticket.</p>:
      <p className="text-gray-500 italic">Overnight ticket.</p>
    }
    <p className="price text-gray-500">
      {isVolunteer ? 'Volunteering' : priceFormat(price, currency)}
    </p>
    <p className="availability text-xs uppercase text-accent">
      {available > 0 ? `${available} available` : 'not available'}
    </p>
    { name === selectedTicketOption?.name ?
      <p>{ disclaimer }</p>:
      ''
    }
  </button>
);

const TicketOptions: FC<Props> = ({
  items,
  selectTicketOption,
  selectedTicketOption,
  volunteer,
  discountCode,
  setDiscountCode,
  disclaimer
}) => {

  useEffect(() => {
    console.log('discountCode=', discountCode)
  }, [])


  return (
    <>
      <HeadingRow>
        <span className="mr-2">🎟</span>
        <span>{__('bookings_dates_step_tickets_title')}</span>
      </HeadingRow>
      <div className="ticket-options my-4 flex flex-row flex-wrap">
        {volunteer ? (
          <Ticket
            key={volunteer.name}
            name={volunteer.name}
            isVolunteer={true}
            currency={CloserCurrencies.EUR}
            available={20}
            selectTicketOption={selectTicketOption}
            selectedTicketOption={selectedTicketOption}
          />
        ) : (
          items?.map(({ name, price, currency, disclaimer, available, isDayTicket }) => (
            <Ticket
              key={name}
              name={name}
              price={price}
              disclaimer={disclaimer}
              currency={currency}
              available={available}
              isDayTicket={isDayTicket}
              selectTicketOption={selectTicketOption}
              selectedTicketOption={selectedTicketOption}
            />
          ))
        )}
      </div>
      {/* {discountCode} */}
      <DiscountCode
        discountCode={discountCode || ''}
        setDiscountCode={setDiscountCode}
      />
    </>
  );
};

export default TicketOptions;
