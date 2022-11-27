import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';
import DateTimePicker from './DateTimePicker';

dayjs.extend(relativeTime);

export const BookingDates = ({
  isMember,
  conditions: { member, guest },
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) => {
  const renderConditionsDescription = () => {
    if (isMember) {
      return (
        __(
          'bookings_dates_step_member_book_horizon',
          member.maxBookingHorizon,
        ) +
        ', ' +
        __('bookings_dates_step_book_duration', member.maxDuration)
      );
    } else {
      return (
        __('bookings_dates_step_guest_book_horizon', guest.maxBookingHorizon) +
        ', ' +
        __('bookings_dates_step_book_duration', guest.maxDuration)
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl leading-10 font-normal mb-4 border-b border-[#e1e1e1] border-solid pb-2">
        <span className="mr-1">📆</span>
        <span>{__('bookings_dates_step_subtitle')}</span>
      </h2>
      <p>{renderConditionsDescription()}</p>
      <div className="mt-8 flex justify-between items-center md:px-20">
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="start">
            {__('listings_book_check_in')}
          </label>
          <DateTimePicker
            id="start"
            value={startDate}
            minValue={dayjs().format('YYYY-MM-DD')}
            maxValue={dayjs()
              .add(
                isMember ? member.maxBookingHorizon : guest.maxBookingHorizon,
                'days',
              )
              .format('YYYY-MM-DD')}
            onChange={(start) => setStartDate(start.toDate())}
            showTime={false}
          />
        </div>
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="end">
            {__('listings_book_check_out')}
          </label>
          <DateTimePicker
            id="end"
            value={endDate}
            minValue={dayjs(startDate).add(1, 'days').format('YYYY-MM-DD')}
            maxValue={dayjs(startDate)
              .add(isMember ? member.maxDuration : guest.maxDuration, 'days')
              .format('YYYY-MM-DD')}
            onChange={(end) => setEndDate(end.toDate())}
            showTime={false}
          />
        </div>
      </div>
    </div>
  );
};

BookingDates.propTypes = {
  isMember: PropTypes.bool,
  conditions: PropTypes.shape({
    member: PropTypes.shape({
      maxBookingHorizon: PropTypes.number,
      maxDuration: PropTypes.number,
    }),
    guest: PropTypes.shape({
      maxBookingHorizon: PropTypes.number,
      maxDuration: PropTypes.number,
    }),
  }),
  startDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  setStartDate: PropTypes.func,
  setEndDate: PropTypes.func,
};
