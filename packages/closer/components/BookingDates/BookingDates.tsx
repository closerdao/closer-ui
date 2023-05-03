import { FC, useRef } from 'react';

import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { BookingConditions } from '../../types';
import { __ } from '../../utils/helpers';
import DateTimePicker from '../DateTimePicker';
import HeadingRow from '../ui/HeadingRow';

dayjs.extend(relativeTime);

interface Props {
  isMember?: boolean;
  conditions?: BookingConditions;
  startDate: Dayjs;
  endDate: Dayjs;
  setStartDate: (startDate: Dayjs) => void;
  setEndDate: (endDate: Dayjs) => void;
  eventId?: string;
}

const BookingDates: FC<Props> = ({
  isMember,
  conditions,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  eventId,
}) => {
  const { member, guest } = conditions || {};

  const minDate = useRef(startDate.format('YYYY-MM-DD'));
  const maxDate = useRef(endDate.format('YYYY-MM-DD'));

  if (!member || !guest) {
    console.error(
      'Cannot render BookingDates: missing conditions for member or guest',
      conditions,
    );
    return null;
  }

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
      <HeadingRow>
        <span className="mr-2">📆</span>
        <span>{__('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      <p>{renderConditionsDescription()}</p>
      <div className="mt-8 flex justify-between items-center md:px-20">
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="start">
            {__('listings_book_check_in')}
          </label>
          <DateTimePicker
            value={startDate.format('YYYY-MM-DD')}
            minValue={eventId ? minDate.current : dayjs().format('YYYY-MM-DD')}
            maxValue={
              eventId
                ? maxDate.current
                : dayjs()
                    .add(
                      isMember
                        ? member.maxBookingHorizon
                        : guest.maxBookingHorizon,
                      'days',
                    )
                    .format('YYYY-MM-DD')
            }
            onChange={(start) => setStartDate(start)}
            showTime={false}
          />
        </div>
        <div>
          <label className="capitalize font-normal mb-0" htmlFor="end">
            {__('listings_book_check_out')}
          </label>

          <DateTimePicker
            value={endDate.format('YYYY-MM-DD')}
            minValue={
              eventId
                ? minDate.current
                : dayjs(startDate).add(1, 'days').format('YYYY-MM-DD')
            }
            maxValue={
              eventId
                ? maxDate.current
                : dayjs(startDate)
                    .add(
                      isMember ? member?.maxDuration : guest?.maxDuration,
                      'days',
                    )
                    .format('YYYY-MM-DD')
            }
            onChange={(end) => setEndDate(end)}
            showTime={false}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDates;
