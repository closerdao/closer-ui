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
  selectTicketOption: (ticket: object) => void;
  // selectedTicketOption?: object;
  selectedTicketOption?: any;
  disclaimer?: string;
  volunteer?: VolunteerOpportunity;
  discountCode?: string;
  setDiscountCode: Dispatch<SetStateAction<string>>;
  eventId?: string;
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
}) => {
  return (
    <button
      className={`border-2 flex flex-col justify-center rounded-md shadow-lg mr-3 mb-3 p-4 hover:border-accent ${
        name === selectedTicketOption?.name
          ? 'border-accent'
          : 'border-gray-100'
      } ${available > 0 ? 'available' : 'unavailable'}`}
      onClick={() =>
        selectTicketOption({ name, isDayTicket, price, currency, disclaimer })
      }
      disabled={available === 0}
    >
      <h4 title={disclaimer}>{name.split('_').join(' ')}</h4>
      {isDayTicket ? (
        <p className="text-gray-500 italic">Day ticket.</p>
      ) : (
        <p className="text-gray-500 italic">Overnight ticket.</p>
      )}
      <p className="price text-gray-500">
        {isVolunteer ? 'Volunteering' : priceFormat(price, currency)}
      </p>
      <p className="availability text-xs uppercase text-accent">
        {available > 0 ? `${available} available` : 'not available'}
      </p>
      {name === selectedTicketOption?.name ? <p>{disclaimer}</p> : ''}
    </button>
  );
};

const TicketOptions: FC<Props> = ({
  items,
  selectTicketOption,
  selectedTicketOption,
  volunteer,
  discountCode,
  setDiscountCode,
  disclaimer,
  eventId,
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
            selectTicketOption={selectTicketOption}
            selectedTicketOption={selectedTicketOption}
          />
        ) : (
          items?.map(
            ({ name, price, currency, disclaimer, available, isDayTicket }) => (
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
            ),
          )
        )}
      </div>
      <DiscountCode
        eventId={eventId}
        discountCode={discountCode || ''}
        setDiscountCode={setDiscountCode}
        selectedTicketOption={selectedTicketOption}
      />
    </div>
  );
};

export default TicketOptions;