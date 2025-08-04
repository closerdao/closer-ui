import { FC } from 'react';

import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';

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
  canSelectDates?: boolean;
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
  canSelectDates = true,
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
          { var: conditions?.maxBookingHorizon },
        ) +
        ', ' +
        t('bookings_dates_step_book_duration', { var: conditions?.maxDuration })
      );
    }
  };

  const formatEventDates = () => {
    if (!eventStartDate || !eventEndDate) return '';
    
    const start = dayjs(eventStartDate);
    const end = dayjs(eventEndDate);
    const isSameDay = start.isSame(end, 'day');
    
    if (isSameDay) {
      return t('bookings_event_single_day', {
        date: start.format('MMMM D'),
        startTime: start.format('h:mm a'),
        endTime: end.format('h:mm a')
      });
    } else {
      return t('bookings_event_multi_day', {
        startDate: start.format('MMM D'),
        startTime: start.format('h:mm a'),
        endDate: end.format('MMM D'),
        endTime: end.format('h:mm a')
      });
    }
  };

  return (
    <div>
      <HeadingRow>
        <span className="mr-2">📆</span>
        <span>{t('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      {canSelectDates && <p>{renderConditionsDescription()}</p>}

      <div className="mt-8 flex justify-between items-center">
        <div>
          {canSelectDates ? (
            <DateTimePicker
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              blockedDateRanges={blockedDateRanges}
              savedStartDate={savedStartDate}
              savedEndDate={savedEndDate}
              eventStartDate={eventStartDate}
              eventEndDate={eventEndDate}
              defaultMonth={
                eventStartDate ? new Date(eventStartDate) : new Date()
              }
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                {formatEventDates()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDates;
