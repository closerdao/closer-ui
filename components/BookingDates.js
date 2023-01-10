import { useContext, useMemo } from 'react';

import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import PropTypes from 'prop-types';

import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
import DateTimePicker from './DateTimePicker';

dayjs.extend(dayOfYear);

const BookingDates = ({
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

  const { bookedDates, isWalletConnected } = useContext(WalletState);
  // bookedDates[i] = [status, year, dayOfYear, price (BigNumber), timestamp(BigNumber)]
  const bookedDatesFormatted = useMemo(
    () =>
      bookedDates
        ?.filter((dateArr) => dateArr.year === dayjs().year())
        .map((dateArr) =>
          dayjs().year(dateArr[1]).dayOfYear(dateArr[2]).toDate(),
        ),
    [bookedDates],
  );

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
            minValue={new Date()}
            maxValue={dayjs()
              .add(
                isMember ? member.maxBookingHorizon : guest.maxBookingHorizon,
                'days',
              )
              .toDate()}
            onChange={setStartDate}
            disabledDates={isWalletConnected ? bookedDatesFormatted : []}
          />
        </div>
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="end">
            {__('listings_book_check_out')}
          </label>
          <DateTimePicker
            id="end"
            value={endDate}
            minValue={dayjs(startDate).add(1, 'days').toDate()}
            maxValue={dayjs(startDate)
              .add(isMember ? member.maxDuration : guest.maxDuration, 'days')
              .toDate()}
            onChange={setEndDate}
            disabledDates={isWalletConnected ? bookedDatesFormatted : []}
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

export default BookingDates;
