import daysjs from 'dayjs';
import PropTypes from 'prop-types';

import { __, formatCurrency } from '../utils/helpers';

const BookingStepsInfo = ({
  startDate,
  endDate,
  totalGuests,
  savedCurrency,
  backToDates,
}) => (
  <div className="mt-6 flex justify-between gap-2 flex-wrap md:justify-start">
    <div
      onClick={backToDates}
      className="basis-1/2 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center md:flex-initial cursor-pointer"
    >
      <span className="mr-1">📆</span>
      <span>
        {daysjs(startDate).format('MMM DD')} -{' '}
        {daysjs(endDate).format('MMM DD')}
      </span>
    </div>
    <div
      onClick={backToDates}
      className="flex-1 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center md:flex-initial md:w-40 cursor-pointer"
    >
      <span className="mr-1">👨‍👩‍👦</span>
      <span>{`${totalGuests} ${__('booking_accomodation_step_guest')}`}</span>
    </div>
    <div
      onClick={backToDates}
      className="flex basis-1/2 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal justify-between items-center md:flex-initial md:w-40 cursor-pointer"
    >
      <span className="mr-1">💰</span>
      <span>{formatCurrency(savedCurrency)}</span>
    </div>
  </div>
);

BookingStepsInfo.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  totalGuests: PropTypes.string,
  savedCurrency: PropTypes.string,
  backToDates: PropTypes.func,
};

export default BookingStepsInfo;
