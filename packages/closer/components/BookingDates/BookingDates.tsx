import { FC } from 'react';
import React from 'react';

import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { BookingConditions } from '../../types';
import { __ } from '../../utils/helpers';
import DateTimePicker from '../DateTimePicker';

dayjs.extend(relativeTime);

interface Props {
  isMember?: boolean;
  conditions?: BookingConditions;
  startDate: Dayjs;
  endDate: Dayjs;
  setStartDate: (startDate: Dayjs) => void;
  setEndDate: (endDate: Dayjs) => void;
  blocksBookingCalendar?: boolean
}

const BookingDates: FC<Props> = ({
  isMember,
  conditions,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  blocksBookingCalendar
}) => {
  const { member, guest } = conditions || {};
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
            value={startDate.format('YYYY-MM-DD')}
            minValue={blocksBookingCalendar ? startDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}
            maxValue={blocksBookingCalendar ?  endDate.format('YYYY-MM-DD') : dayjs()
              .add(
                isMember ? member.maxBookingHorizon : guest.maxBookingHorizon,
                'days',
              )
              .format('YYYY-MM-DD')}
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
            minValue={blocksBookingCalendar ? startDate.format('YYYY-MM-DD') : dayjs(startDate).add(1, 'days').format('YYYY-MM-DD')}
            
            maxValue={blocksBookingCalendar ? endDate.format('YYYY-MM-DD') : dayjs(startDate)
              .add(isMember ? member?.maxDuration : guest?.maxDuration, 'days')
              .format('YYYY-MM-DD')}
            onChange={(end) => setEndDate(end)}
            showTime={false}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDates;
