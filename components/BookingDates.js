import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { getBookedDatesObjects } from '../utils/bookings';
import { __ } from '../utils/helpers';
import DateTimePicker from './DateTimePicker';

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

  const { platform } = usePlatform();
  const { user } = useAuth();

  const bookingsFilter = user && {
    where: {
      createdBy: user._id,
      status: ['pending', 'confirmed', 'checkedIn', 'checkedOut'],
      end: {
        $gt: new Date(),
      },
    },
  };
  const [bookingDates, setBookingDates] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await platform.booking.get(bookingsFilter);
        const bookings = res.results.toJS();
        const bookedDates = getBookedDatesObjects(bookings);
        setBookingDates(bookedDates);
      } catch (err) {
        console.error('Error loading bookings: ', err);
      }
    };
    if (user) {
      loadData();
    }
  }, [user]);

  // const bookings = platform.booking.find(bookingsFilter) > undefined
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
            value={startDate}
            minValue={new Date()}
            maxValue={dayjs()
              .add(
                isMember ? member.maxBookingHorizon : guest.maxBookingHorizon,
                'days',
              )
              .toDate()}
            onChange={setStartDate}
            disabledDates={bookingDates}
          />
        </div>
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="end">
            {__('listings_book_check_out')}
          </label>
          <DateTimePicker
            value={endDate}
            minValue={dayjs(startDate).add(1, 'days').toDate()}
            maxValue={dayjs(startDate)
              .add(isMember ? member.maxDuration : guest.maxDuration, 'days')
              .toDate()}
            onChange={setEndDate}
            disabledDates={bookingDates}
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
