import { FC } from 'react';

import { BookingConditions } from '../../types';
import { __ } from '../../utils/helpers';
import DateTimePicker from '../DateTimePicker';
import HeadingRow from '../ui/HeadingRow';

interface Props {
  isMember?: boolean;
  conditions?: BookingConditions;
  startDate?: string | null;
  endDate?: string | null;
  setStartDate: (startDate: string | null) => void;
  setEndDate: (endDate: string | null) => void;
  blockedDateRanges: (
    | Date
    | {
        from: Date;
        to: Date;
      }
  )[];
  savedStartDate?: string;
  savedEndDate?: string;
}

const BookingDates: FC<Props> = ({
  isMember,
  conditions,
  setStartDate,
  setEndDate,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
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
      <HeadingRow>
        <span className="mr-2">📆</span>
        <span>{__('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      <p>{renderConditionsDescription()}</p>
      <div className="mt-8 flex justify-between items-center">
        <div>
          <DateTimePicker
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            maxDuration={
              isMember
                ? conditions?.member.maxDuration
                : conditions?.guest.maxDuration
            }
            blockedDateRanges={blockedDateRanges}
            savedStartDate={savedStartDate}
            savedEndDate={savedEndDate}
            defaultMonth={new Date()}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDates;
