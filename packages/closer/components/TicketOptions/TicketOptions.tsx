import { Dispatch, FC, SetStateAction } from 'react';

import {
  CloserCurrencies,
  TicketOption,
  VolunteerOpportunity,
} from '../../types';
import { __, priceFormat } from '../../utils/helpers';
import DiscountCode from '../DiscountCode';

interface Props {
  items?: TicketOption[];
  selectTicketName: (name: string) => void;
  selectedTicketName?: string;
  volunteer?: VolunteerOpportunity;
  discountCode?: string;
  setDiscountCode: Dispatch<SetStateAction<string>>;
}

const Ticket = ({
  name,
  price,
  currency,
  available,
  selectTicketName,
  selectedTicketName,
  isVolunteer,
}: {
  name: string;
  price?: number;
  currency: string;
  available: number;
  selectTicketName: (name: string) => void;
  selectedTicketName?: string;
  isVolunteer?: boolean;
}) => {
  console.log('currency=', currency);
  return (
    <button
      className={`border-2 flex flex-col justify-center rounded-md shadow-lg mr-3 mb-3 p-4 hover:border-accent ${
        name === selectedTicketName ? 'border-accent' : 'border-gray-100'
      } ${available > 0 ? 'available' : 'unavailable'}`}
      onClick={() => selectTicketName(name)}
      disabled={available === 0}
    >
      <h4>{name.split('_').join(' ')}</h4>
      <p className="price text-gray-500">
        {isVolunteer ? 'Volunteering' : priceFormat(price, currency)}
      </p>
      <p className="availability text-xs uppercase text-accent">
        {available > 0 ? `${available} available` : 'not available'}
      </p>
    </button>
  );
};

const TicketOptions: FC<Props> = ({
  items,
  selectTicketName,
  selectedTicketName,
  volunteer,
  discountCode,
  setDiscountCode,
}) => {
  return (
    <div>
      <h2 className="mb-3 text-2xl leading-10 font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
        <span className="mr-1">🎟</span>
        <span>{__('bookings_dates_step_tickets_title')}</span>
      </h2>

      {/* TODO: convert to reusable components:
      <Heading level={2} className="mb-8">
        🎟 {__('bookings_dates_step_tickets_title')}
      </Heading> */}

      <div className="ticket-options my-4 flex flex-row flex-wrap">
        {volunteer ? (
          <Ticket
            key={volunteer.name}
            name={volunteer.name}
            isVolunteer={true}
            currency={CloserCurrencies.EUR}
            available={20}
            selectTicketName={selectTicketName}
            selectedTicketName={selectedTicketName}
          />
        ) : (
          items?.map(({ name, price, currency, available }) => (
            <Ticket
              key={name}
              name={name}
              price={price}
              currency={currency}
              available={available}
              selectTicketName={selectTicketName}
              selectedTicketName={selectedTicketName}
            />
          ))
        )}
      </div>
      <DiscountCode
        discountCode={discountCode || ''}
        setDiscountCode={setDiscountCode}
      />
    </div>
  );
};

export default TicketOptions;
