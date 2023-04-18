import dayjs from 'dayjs';

import { __ } from '../utils/helpers';

interface SummaryDatesProps {
  totalGuests: number;
  startDate: string;
  endDate: string;
  listingName: string;
  commitment?: string;
  event?: string;
  ticketOption?: string;
}

const SummaryDates = ({
  totalGuests,
  startDate,
  endDate,
  listingName,
  commitment,
  event,
  ticketOption,
}: SummaryDatesProps) => (
  <div>
    {event ? (
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
    {event && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('bookings_summary_step_dates_event')}</p>
        <p className="font-bold uppercase text-right">{event}</p>
      </div>
    )}
    {ticketOption && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_ticket_option')}</p>
        <p className="font-bold uppercase">{ticketOption}</p>
      </div>
    )}
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_summary_step_dates_number_of_guests')}</p>
      <p className="font-bold">{totalGuests}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p> {__('listings_book_check_in')}</p>
      <p className="font-bold">{dayjs(startDate).format('DD / MM / YY')}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p> {__('listings_book_check_out')}</p>
      <p className="font-bold">{dayjs(endDate).format('DD / MM / YY')}</p>
    </div>
    <div className="flex justify-between items-start mt-3">
      <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
      <p className="font-bold uppercase">{listingName}</p>
    </div>


    
    {commitment && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_commitment')}</p>
        <p className="font-bold uppercase">{commitment}</p>
      </div>
    )}
  </div>
);

export default SummaryDates;
