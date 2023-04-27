import dayjs from 'dayjs';

import { __ } from '../utils/helpers';

interface SummaryDatesProps {
  isDayTicket: boolean;
  totalGuests: number;
  startDate: string;
  endDate: string;
  listingName: string;
  eventName?: string;
  ticketOption?: string;
  volunteerId?: string;
}

const SummaryDates = ({
  isDayTicket,
  totalGuests,
  startDate,
  endDate,
  listingName,
  volunteerId,
  eventName,
  ticketOption,
}: SummaryDatesProps) => (
  <div>
    {eventName ? (
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
        <span className="mr-1">🏡</span>
        <span>{__('bookings_summary_step_your_event')}</span>
      </h2>
    ) : (
      <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
        <span className="mr-1">🏡</span>
        <span>{__('bookings_summary_step_dates_title')}</span>
      </h2>
    )}
    {eventName && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('bookings_summary_step_dates_event')}</p>
        <p className="font-bold uppercase text-right">{eventName}</p>
      </div>
    )}
    {ticketOption && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_ticket_option')}</p>
        <p className="font-bold uppercase">{ticketOption}  X {totalGuests}</p>
      </div>
    )}
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_summary_step_dates_number_of_guests')}</p>
      <p className="font-bold">{totalGuests}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p> { isDayTicket ? __('listings_book_day') : __('listings_book_check_in')}</p>
      <p className="font-bold">{dayjs(startDate).format('DD / MM / YY')}</p>
    </div>
    { !isDayTicket && <div className="flex justify-between items-start my-3">
      <p> {__('listings_book_check_out')}</p>
      <p className="font-bold">{dayjs(endDate).format('DD / MM / YY')}</p>
    </div> }
    { listingName && <div className="flex justify-between items-start mt-3">
      <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
      <p className="font-bold uppercase text-right">{listingName}</p>
    </div> }

    {volunteerId && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_commitment')}</p>
        <p className="font-bold uppercase">{__('bookings_summary_step_dates_default_commitment')}</p>
      </div>
    )}
  </div>
);

export default SummaryDates;
