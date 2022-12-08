import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';

const SummaryDates = ({ totalGuests, startDate, endDate, listingName }) => (
  <div>
    <h2 className="text-2xl leading-10 font-normal border-solid border-b border-neutral-200 pb-2">
      <span className="mr-1">🏡</span>
      <span>{__('bookings_summary_step_dates_title')}</span>
    </h2>
    <div className="flex justify-between items-center my-3">
      <p>{__('bookings_summary_step_dates_number_of_guests')}</p>
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
      <p>{__('bookings_summary_step_dates_accomodation_type')}</p>
      <p className="font-bold uppercase">{listingName}</p>
    </div>
  </div>
);

SummaryDates.propTypes = {
  totalGuests: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  listingName: PropTypes.string,
};

export default SummaryDates;
