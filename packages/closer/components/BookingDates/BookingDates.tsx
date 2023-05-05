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
  // startDate: Dayjs;
  startDate: Date;
  endDate: Dayjs;
  // setStartDate: (startDate: Dayjs) => void;
  setStartDate: (startDate: Date) => void;
  setEndDate: (endDate: Dayjs) => void;
  eventId?: string;
  blockedDateRanges: (Date | {
    from: Date;
    to: Date;
})[]
}

const BookingDates: FC<Props> = ({
  isMember,
  conditions,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  eventId,
  blockedDateRanges,
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

  // const isDateInRange = (date: Date) => {
  //   return blockedDateRanges.some(([start, end]) => {
  //     return start <= date && date <= end;
  //   });
  // };

  // const handleSelectStartDate = (startDate: dayjs.Dayjs) => {
  const handleSelectStartDate = (startDate: Date) => {
    // if (blockedDateRanges.length) {
    //   if (isDateInRange(new Date(startDate.toDate()))) {
    //     console.log('date sis blocked!');
    //   } else {
    //     console.log('date is free!');
    //   }
    // }
    setStartDate(startDate);
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
          {JSON.stringify(blockedDateRanges)}
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
            onChange={(start) => handleSelectStartDate(start)}
            showTime={false}
            blockedDateRanges={blockedDateRanges}
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
