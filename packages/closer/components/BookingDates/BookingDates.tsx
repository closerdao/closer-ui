import { FC } from 'react';

import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';

import { BookingConditions } from '../../types';
import DateTimePicker from '../DateTimePicker';
import { IconCalendar } from '../BookingIcons';
import HeadingRow from '../ui/HeadingRow';

interface Props {
  isMember?: boolean;
  conditions?: BookingConditions;
  isVolunteerApplication?: boolean;
  isResidenceApplication?: boolean;
  volunteerMinStay?: number;
  residenceMinStay?: number;
  startDate?: string | null | Date;
  endDate?: string | null | Date;
  setStartDate: (startDate: string | null | Date) => void;
  setEndDate: (endDate: string | null | Date) => void;
  currentStartDate?: string | null | Date;
  currentEndDate?: string | null | Date;
  calendarError?: string | null;
  onCalendarErrorDismiss?: () => void;
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
  isVolunteerApplication,
  isResidenceApplication,
  volunteerMinStay,
  residenceMinStay,
  setStartDate,
  setEndDate,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
  currentStartDate,
  currentEndDate,
  calendarError,
  onCalendarErrorDismiss,
  eventStartDate,
  eventEndDate,
  canSelectDates = true,
}) => {
  const startDate = currentStartDate ?? savedStartDate;
  const endDate = currentEndDate ?? savedEndDate;
  const t = useTranslations();
  const renderConditionsDescription = () => {
    if (isResidenceApplication) {
      if (residenceMinStay != null) {
        return t('bookings_dates_step_residence_min_stay', {
          var: residenceMinStay,
        });
      }
      return t('bookings_dates_step_residence_conditions');
    }
    if (isVolunteerApplication && volunteerMinStay != null) {
      return t('bookings_dates_step_volunteer_min_stay', { var: volunteerMinStay });
    }
    if (isMember) {
      return (
        t('bookings_dates_step_member_book_horizon', {
          var: conditions?.memberMaxBookingHorizon,
        }) +
        ', ' +
        t('bookings_dates_step_book_duration', {
          var: conditions?.memberMaxDuration,
        }) +
        ' ' +
        t('bookings_dates_step_min_stay', {
          var: conditions?.memberMinDuration,
        })
      );
    } else {
      return (
        t('bookings_dates_step_guest_book_horizon', {
          var: conditions?.maxBookingHorizon,
        }) +
        ', ' +
        t('bookings_dates_step_book_duration', { var: conditions?.maxDuration }) +
        ' ' +
        t('bookings_dates_step_min_stay', { var: conditions?.minDuration })
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

  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;
  const nights =
    start && end && end.isAfter(start) ? end.diff(start, 'day') : 0;

  return (
    <div className="rounded-lg border border-neutral-dark bg-neutral-light p-3 sm:p-4">
      <HeadingRow>
        <IconCalendar />
        <span>{t('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      {canSelectDates && <p className="mt-1">{renderConditionsDescription()}</p>}

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="relative">
            {canSelectDates ? (
              <>
                {calendarError && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 max-w-sm w-full z-[100] flex items-start gap-2 rounded-lg border border-error bg-white px-3 py-2.5 shadow-lg"
                    role="alert"
                  >
                    <p className="text-sm font-medium text-error flex-1">
                      {t('bookings_dates_error_prefix')}: {calendarError}
                    </p>
                    {onCalendarErrorDismiss && (
                      <button
                        type="button"
                        onClick={onCalendarErrorDismiss}
                        className="shrink-0 rounded p-0.5 text-error hover:bg-error/20 focus:outline-none focus:ring-2 focus:ring-error/40"
                        aria-label={t('autocomplete_close')}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
                <DateTimePicker
                  setStartDate={setStartDate}
                  setEndDate={setEndDate}
                  blockedDateRanges={blockedDateRanges}
                  savedStartDate={savedStartDate}
                  savedEndDate={savedEndDate}
                  durationLabel={
                    nights > 0
                      ? t('bookings_dates_nights_selected', { count: nights })
                      : undefined
                  }
                  eventStartDate={eventStartDate}
                  eventEndDate={eventEndDate}
                  defaultMonth={
                    eventStartDate ? new Date(eventStartDate) : new Date()
                  }
                />
              </>
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
    </div>
  );
};

export default BookingDates;
