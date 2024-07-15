import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { BookingConditions } from '../../types';
import DateTimePicker from '../DateTimePicker';
import HeadingRow from '../ui/HeadingRow';

interface Props {
  isMember?: boolean;
  conditions?: BookingConditions;
  startDate?: string | null | Date;
  endDate?: string | null | Date;
  setStartDate: (startDate: string | null | Date) => void;
  setEndDate: (endDate: string | null | Date) => void;
  blockedDateRanges: (
    | Date
    | {
        from: Date;
        to: Date;
      }
  )[];
  savedStartDate?: string;
  savedEndDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
}

const BookingDates: FC<Props> = ({
  isMember,
  conditions,
  setStartDate,
  setEndDate,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
  eventStartDate,
  eventEndDate,
}) => {
  const t = useTranslations();
  const renderConditionsDescription = () => {
    if (isMember) {
      return (
        t(
          'bookings_dates_step_member_book_horizon',
         { var: conditions?.memberMaxBookingHorizon }
          
        ) +
        ', ' +
        t('bookings_dates_step_book_duration',
          { var: conditions?.memberMaxDuration }
          
          )
      );
    } else {
      return (
        t(
          'bookings_dates_step_guest_book_horizon'
          ,
          { var: conditions?.guestMaxBookingHorizon },
        ) +
        ', ' +
        t('bookings_dates_step_book_duration', { var: conditions?.guestMaxDuration })
      );
    }
  };

  return (
    <div>
      <HeadingRow>
        <span className="mr-2">📆</span>
        <span>{t('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      <p>{renderConditionsDescription()}</p>
      <div className="mt-8 flex justify-between items-center">
        <div>
          <DateTimePicker
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            maxDuration={
              isMember
                ? conditions?.memberMaxDuration
                : conditions?.guestMaxDuration
            }
            blockedDateRanges={blockedDateRanges}
            savedStartDate={savedStartDate}
            savedEndDate={savedEndDate}
            eventStartDate={eventStartDate}
            eventEndDate={eventEndDate}
            defaultMonth={
              eventStartDate ? new Date(eventStartDate) : new Date()
            }
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDates;
