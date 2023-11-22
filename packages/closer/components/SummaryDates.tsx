import Link from 'next/link';

import dayjs from 'dayjs';

import { __ } from '../utils/helpers';
import HeadingRow from './ui/HeadingRow';

interface SummaryDatesProps {
  isDayTicket: boolean;
  totalGuests: number;
  kids?: number;
  pets?: number;
  infants?: number;
  startDate: string;
  endDate: string;
  listingName: string;
  listingUrl: string;
  eventName?: string;
  volunteerName?: string;
  ticketOption?: string;
  volunteerId?: string;
  doesNeedPickup?: boolean;
  doesNeedSeparateBeds?: boolean;
}

const SummaryDates = ({
  isDayTicket,
  totalGuests,
  kids,
  pets,
  infants,
  startDate,
  endDate,
  listingName,
  listingUrl,
  volunteerId,
  eventName,
  volunteerName,
  ticketOption,
  doesNeedPickup,
  doesNeedSeparateBeds,
}: SummaryDatesProps) => (
  <div>
    {eventName ? (
      <HeadingRow>
        <span className="mr-4">🏡</span>
        <span>{__('bookings_summary_step_your_event')}</span>
      </HeadingRow>
    ) : (
      <HeadingRow>
        <span className="mr-4">🏡</span>
        <span>{__('bookings_summary_step_dates_title')}</span>
      </HeadingRow>
    )}
    {eventName && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('bookings_summary_step_dates_event')}</p>
        <p className="font-bold text-right">{eventName}</p>
      </div>
    )}
    {volunteerName && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('bookings_summary_step_volunteer_opportunity')}</p>
        <p className="font-bold text-right">{volunteerName}</p>
      </div>
    )}
    {ticketOption && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_ticket_option')}</p>
        <p className="font-bold uppercase">
          {ticketOption} X {totalGuests}
        </p>
      </div>
    )}
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_summary_step_dates_number_of_guests')}</p>
      <p className="font-bold">{totalGuests}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_dates_step_guests_children')}</p>
      <p className="font-bold">{kids}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_dates_step_guests_infants')}</p>
      <p className="font-bold">{infants}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p>{__('bookings_dates_step_guests_pets')}</p>
      <p className="font-bold">{pets}</p>
    </div>
    <div className="flex justify-between items-start my-3">
      <p>
        {' '}
        {isDayTicket ? __('listings_book_day') : __('listings_book_check_in')}
      </p>
      <p className="font-bold">{dayjs(startDate).format('DD / MM / YY')}</p>
    </div>
    {!isDayTicket && (
      <>
        <div className="flex justify-between items-start my-3">
          <p> {__('listings_book_check_out')}</p>
          <p className="font-bold">{dayjs(endDate).format('DD / MM / YY')}</p>
        </div>

        <div className="flex justify-between items-start my-3">
          <p> {__('bookings_stay_duration')}</p>
          <p className="font-bold">
            {dayjs(endDate).diff(dayjs(startDate), 'day')}
          </p>
        </div>
      </>
    )}

    {listingName && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
        <Link
          href={`/stay/${listingUrl}`}
          className="font-bold uppercase text-right text-accent"
        >
          {listingName}
        </Link>
      </div>
    )}

    {volunteerId && (
      <div className="flex justify-between items-start mt-3">
        <p>{__('bookings_summary_step_dates_commitment')}</p>
        <p className="font-bold uppercase">
          {__('bookings_summary_step_dates_default_commitment')}
        </p>
      </div>
    )}
    {doesNeedPickup !== undefined && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('bookings_pickup')}</p>
        <p className="font-bold uppercase text-right">
          {doesNeedPickup ? __('generic_yes') : __('generic_no')}
        </p>
      </div>
    )}
    {doesNeedSeparateBeds !== undefined && (
      <div className="flex justify-between mt-3 gap-20 items-start	">
        <p>{__('booking_card_separate_beds_needed')}</p>
        <p className="font-bold uppercase text-right">
          {doesNeedSeparateBeds ? __('generic_yes') : __('generic_no')}
        </p>
      </div>
    )}
  </div>
);

export default SummaryDates;
