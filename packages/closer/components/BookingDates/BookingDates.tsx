import { FC } from 'react';

import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { Info } from 'lucide-react';

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

  const start = startDate ? dayjs(startDate) : null;
  const end = endDate ? dayjs(endDate) : null;
  const nights =
    start && end && end.isAfter(start) ? end.diff(start, 'day') : 0;

  const fixedDatesLabel =
    start && end
      ? `${start.format('MMM D')} – ${end.format('MMM D')}`
      : null;

  return (
    <div className="rounded-lg border border-neutral-dark bg-neutral-light p-3 sm:p-4">
      <HeadingRow>
        <IconCalendar />
        <span>{t('bookings_dates_step_subtitle')}</span>
      </HeadingRow>
      {canSelectDates && <p className="mt-1">{renderConditionsDescription()}</p>}

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="relative w-full">
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
              <div
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-default"
                aria-disabled="true"
              >
                <p className="text-sm md:text-base font-medium text-gray-900 inline-flex items-center gap-1.5">
                  <span className="opacity-70">
                    {fixedDatesLabel}
                    {nights > 0 && (
                      <span className="text-gray-500 font-normal">
                        {' '}
                        ·{' '}
                        {t('bookings_dates_nights_selected', { count: nights })}
                      </span>
                    )}
                  </span>
                  <span
                    className="relative group/info inline-flex shrink-0"
                    tabIndex={0}
                    aria-label={t('stay_search_bar_event_dates_fixed_hint')}
                  >
                    <Info
                      className="h-3.5 w-3.5 text-gray-400"
                      aria-hidden
                    />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-normal leading-snug text-gray-600 opacity-0 shadow-md transition-opacity group-hover/info:opacity-100 group-focus/info:opacity-100"
                    >
                      {t('stay_search_bar_event_dates_fixed_hint')}
                    </span>
                  </span>
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
