import dayjs from 'dayjs';

import { __ } from '../utils/helpers';

export const CheckoutDates = ({
  totalGuests,
  startDate,
  endDate,
  totalNights,
}) => (
  <div>
    <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
      <span className="mr-1">📆</span>
      <span>{__('bookings_checkout_step_dates_title')}</span>
    </h2>
    <div className="flex justify-between items-center my-3">
      <p>{__('bookings_checkout_step_dates_number_of_guests')}</p>
      <p className="font-bold">{totalGuests}</p>
    </div>
    <div className="flex justify-between items-center my-3">
      <p> {__('listings_book_check_in')}</p>
      <p className="font-bold">{dayjs(startDate).format('DD / MM / YY')}</p>
    </div>
    <div className="flex justify-between items-center my-3">
      <p> {__('listings_book_check_out')}</p>
      <p className="font-bold">{dayjs(endDate).format('DD / MM / YY')}</p>
    </div>
    <div className="flex justify-between items-center mt-3">
      <p>{__('bookings_checkout_step_dates_nights')}</p>
      <p className="font-bold">{totalNights}</p>
    </div>
  </div>
);
