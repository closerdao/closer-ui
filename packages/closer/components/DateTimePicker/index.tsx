import { useRouter } from 'next/router';

import { ChangeEventHandler, FormEvent, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { getDateOnly, getTimeOnly } from '../../utils/booking.helpers';
import TimePicker from '../TimePicker';
import { Button, ErrorMessage, Input } from '../ui';
import {
  getDateTime,
  includesBlockedDateRange,
  normalizeBlockedDateRangesForDayPicker,
} from './dateTimePicker.utils';

interface Props {
  value?: string;
  minValue?: string | null;
  maxValue?: string | null;
  setStartDate: (date: string | null | Date) => void;
  setEndDate: (date: string | null | Date) => void;
  maxDuration?: number;
  startCollapsed?: boolean;
  blockedDateRanges?: (
    | Date
    | {
        from: Date;
        to: Date;
      }
  )[];
  savedStartDate?: string | Date | null;
  savedEndDate?: string | Date | null;
  eventStartDate?: string;
  eventEndDate?: string;
  defaultMonth?: Date;
  isAdmin?: boolean;
  priceDuration?: string;
  timeOptions?: string[] | null;
  hourAvailability?: { hour: string; isAvailable: boolean }[] | [];
  timeZone?: string;
  isDashboard?: boolean;
  durationLabel?: string;
  hideSelectionSummary?: boolean;
  compactCalendar?: boolean;
}

const DateTimePicker = ({
  setStartDate,
  setEndDate,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
  eventStartDate,
  eventEndDate,
  defaultMonth,
  isAdmin,
  priceDuration = 'night',
  timeOptions,
  hourAvailability,
  timeZone,
  isDashboard,
  startCollapsed = false,
  durationLabel,
  hideSelectionSummary = false,
  compactCalendar = false,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(!startCollapsed);
  // Store the original full dates for timezone conversion
  const originalStartDate = savedStartDate;
  const originalEndDate = savedEndDate;

  // Convert to date-only for calendar display
  savedStartDate = getDateOnly(savedStartDate);
  savedEndDate = getDateOnly(savedEndDate);

  const t = useTranslations();
  const router = useRouter();
  const { volunteerId, bookingType } = router.query;
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateError, setDateError] = useState<null | string>(null);
  const [isOneMonthCalendar, setIsOneMonthCalendar] = useState(false);
  // Helper function to get time in the specified timezone
  const getTimeInTimezone = (
    date: Date | string | null | undefined,
    tz?: string,
  ) => {
    if (!date) return null;

    // Check if the date string has time information
    const dateStr = date.toString();
    const hasTime = dateStr.includes('T') || dateStr.includes(' ');

    if (tz) {
      if (hasTime) {
        // Full datetime - convert timezone
        return dayjs.utc(date).tz(tz).format('HH:mm');
      } else {
        // Date-only - return null so we can use default time
        return null;
      }
    }
    return dayjs(date).format('HH:mm');
  };

  const [startTime, setStartTime] = useState(() => {
    return getTimeInTimezone(originalStartDate, timeZone) || '12:00';
  });
  const [endTime, setEndTime] = useState(() => {
    return getTimeInTimezone(originalEndDate, timeZone) || '12:00';
  });

  const [isDateRangeSet, setIsDateRangeSet] = useState(false);

  const startTimeOnly = getTimeOnly(savedStartDate);
  const endTimeOnly = getTimeOnly(savedEndDate);
  const isStartTimeSelected = startTimeOnly
    ? timeOptions?.includes(startTimeOnly)
    : false;

  useEffect(() => {
    const handleWindowResize = () => {
      if (window.innerWidth < 600) {
        setIsOneMonthCalendar(true);
      } else {
        setIsOneMonthCalendar(false);
      }
    };
    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  // Update time values when saved dates or timezone change
  useEffect(() => {
    const newStartTime = getTimeInTimezone(originalStartDate, timeZone);
    const newEndTime = getTimeInTimezone(originalEndDate, timeZone);
    if (newStartTime) setStartTime(newStartTime);
    if (newEndTime) setEndTime(newEndTime);
  }, [originalStartDate, originalEndDate, timeZone]);

  const checkDefaultDatesAreAvailable = (
    blockedDateRanges: Date[],
    start: Date,
    end: Date,
  ) => {
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return !blockedDateRanges?.some((date) => {
      date.setHours(0, 0, 0, 0);
      return date >= start && date <= end;
    });
  };

  const getBlockedDays = (dateArray: any[]) => {
    return dateArray
      ?.map((date) => {
        if (date instanceof Date) {
          return date;
        }
        return null;
      })
      .filter((date) => date !== null);
  };

  useEffect(() => {
    const blockedDays = getBlockedDays(blockedDateRanges as any[]);

    const defaultDatesAreAvailable = checkDefaultDatesAreAvailable(
      blockedDays as Date[],
      new Date(savedStartDate as string),
      new Date(savedEndDate as string),
    );

    if (
      savedStartDate &&
      savedEndDate &&
      !volunteerId &&
      bookingType !== 'volunteer' &&
      bookingType !== 'residence' &&
      defaultDatesAreAvailable
    ) {
      if (!isDateRangeSet) {
        setDateRange({
          from: new Date(savedStartDate),
          to: savedEndDate ? new Date(savedEndDate) : undefined,
        });
        if (isAdmin) {
          // Use timezone-aware conversion instead of direct formatting
          const startTimeFromOriginal = getTimeInTimezone(
            originalStartDate,
            timeZone,
          );
          const endTimeFromOriginal = getTimeInTimezone(
            originalEndDate,
            timeZone,
          );

          if (startTimeFromOriginal) {
            setStartTime(startTimeFromOriginal);
          }
          if (endTimeFromOriginal) {
            setEndTime(endTimeFromOriginal);
          }
        }
      }
    }
  }, [
    savedStartDate,
    savedEndDate,
    originalStartDate,
    originalEndDate,
    timeZone,
  ]);

  useEffect(() => {
    if (eventStartDate && eventEndDate) {
      if (!isDateRangeSet) {
        if (
          (eventStartDate !== savedStartDate ||
            eventEndDate !== savedEndDate) &&
          !volunteerId &&
          bookingType !== 'volunteer' &&
          bookingType !== 'residence'
        ) {
          setDateRange({
            from: new Date(savedStartDate as string),
            to: new Date(savedEndDate as string),
          });
          setEndDate(savedEndDate as string);
          setStartDate(savedStartDate as string);
        } else {
          if (
            !volunteerId &&
            bookingType !== 'volunteer' &&
            bookingType !== 'residence'
          ) {
            setDateRange({
              from: new Date(eventStartDate),
              to: new Date(eventEndDate),
            });
            setStartDate(eventStartDate);
            setEndDate(eventEndDate);
          }
        }
      }
      if (
        volunteerId &&
        (dayjs(eventStartDate).format('YYYY-MM-DD') !== savedStartDate ||
          dayjs(eventEndDate).format('YYYY-MM-DD') !== savedEndDate)
      ) {
        setDateRange({
          from: new Date(savedStartDate as string),
          to: new Date(savedEndDate as string),
        });
        setEndDate(savedStartDate as string);
        setStartDate(savedEndDate as string);
      }
      setIsDateRangeSet(true);
    }
  }, [eventStartDate, eventEndDate]);

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    let time = event.target.value;
    if (!time) {
      time = '12:00';
    }
    const [hours, minutes] = time.split(':').map((str) => parseInt(str, 10));
    if (event.target.id === 'startTime') {
      const formattedDate = getDateTime(
        savedStartDate as string,
        hours,
        minutes,
        timeZone,
      );
      setStartDate(formattedDate);
      setStartTime(time); // Use the original input time, not the formatted date
    }
    if (event.target.id === 'endTime') {
      const formattedDate = getDateTime(
        savedEndDate as string,
        hours,
        minutes,
        timeZone,
      );
      setEndDate(formattedDate);
      setEndTime(time); // Use the original input time, not the formatted date
    }
  };

  const updateDateRange = (range: DateRange | undefined) => {
    if (priceDuration !== 'night') {
      const fromDate = getDateOnly(range?.from);
      const toDate = getDateOnly(range?.to);
      if (
        (range?.from && dateRange?.from && dateRange.from > range.from) ||
        (range?.from && !range?.to)
      ) {
        setDateRange({ from: range.from, to: range.from });
        setStartDate(`${fromDate}`);
        setEndDate(`${fromDate}`);
        return;
      }
      if (range?.from && dateRange?.from && range.to && range.to > range.from) {
        setDateRange({ from: range.to, to: range.to });
        setStartDate(`${toDate}`);
        setEndDate(`${toDate}`);
        return;
      }
    }

    if (!includesBlockedDateRange(range, blockedDateRanges)) {
      if (range?.from && dateRange?.from && dateRange.from > range.from) {
        setDateRange({ from: range.from, to: undefined });
        setStartDate(range.from);
        setEndDate(null);
        return;
      }
      if (range?.from && dateRange?.from && dateRange.to) {
        const newTo = range.to;
        if (newTo) {
          range = { from: newTo, to: undefined };
          setDateRange({ from: newTo, to: undefined });
          setStartDate(newTo as Date);
        } else {
          range = { from: dateRange.to, to: undefined };
          setDateRange({ from: dateRange.to, to: undefined });
          setStartDate(dateRange.to as Date);
        }
        setEndDate(null);
        return;
      }

      if (!range && dateRange?.from?.getTime() === dateRange?.to?.getTime()) {
        setEndDate(null);
        setStartDate(null);
        setDateRange({ from: undefined, to: undefined });
        return;
      }

      if (!range?.from && dateRange?.from && dateRange?.to) {
        range = { from: dateRange.from, to: undefined };
        setDateRange({ from: dateRange.from, to: undefined });
        setStartDate(dateRange.from);
        setEndDate(null);
        return;
      }

      setDateRange(range);

      if (range?.to) {
        if (endTime === '12:00' && isAdmin) {
          const formattedDate = getDateTime(range?.to, 12, 0);
          setEndDate(formattedDate);
        } else {
          setEndDate(range?.to);
        }
      } else {
        setEndDate(null);
      }
      if (range?.from) {
        if (startTime === '12:00' && isAdmin) {
          const formattedDate = getDateTime(range?.from, 12, 0);
          setStartDate(formattedDate);
        } else {
          setStartDate(range?.from);
        }
      } else {
        setStartDate(range?.from as Date);
      }
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleSelectDay = (range: DateRange | undefined) => {
    setDateError(null);
    updateDateRange(range);
  };

  const handleClearDates = (e: FormEvent) => {
    e.preventDefault();
    setDateRange({ from: undefined, to: undefined });
    setStartDate(null);
    setEndDate(null);
    setIsDateRangeSet(false);
  };

  const showCalendar = !startCollapsed || isExpanded;
  const dateTagClass =
    'text-xs md:text-sm border rounded-full bg-neutral py-2 px-3 font-medium inline-flex items-center justify-center shrink-0 min-w-4 text-center';
  const durationTagClass =
    'text-xs md:text-sm font-medium text-foreground/90 py-2 px-3 rounded-full bg-accent/20 min-w-4 inline-flex items-center justify-center shrink-0 text-center border border-accent/30';

  const formatRangeDate = (date: Date | undefined) => {
    if (!date) return t('events_date_select');
    return dayjs(date).format('ddd, MMM D');
  };

  const formatRangeTime = (time: string | null | undefined) => {
    if (!time) return '--:--';
    const parsed = dayjs(`2000-01-01T${time}`);
    if (!parsed.isValid()) return time;
    return parsed.format('h:mm A');
  };

  const startDisplayDate = dateRange?.from
    ? dateRange.from
    : savedStartDate
      ? new Date(savedStartDate as string)
      : undefined;
  const endDisplayDate = dateRange?.to
    ? dateRange.to
    : savedEndDate
      ? new Date(savedEndDate as string)
      : undefined;

  const rangeSummaryContent = (
    <>
      <div className="flex">
        <div className="flex flex-col items-center w-10 pt-5 pb-5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(0,0,0,0.04)] ring-4 ring-accent/15" />
          <span className="w-px flex-1 bg-gray-200 my-1.5 min-h-[18px]" />
          <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-white" />
        </div>

        <div className="flex-1 min-w-0 py-2 pr-3">
          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium">
                {t('events_date_start')}
              </p>
              <p
                className={`text-[15px] font-medium truncate ${
                  startDisplayDate ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {formatRangeDate(startDisplayDate)}
              </p>
            </div>
            <p
              className={`text-[15px] font-medium tabular-nums shrink-0 ${
                startDisplayDate ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              {startDisplayDate ? formatRangeTime(startTime) : '—'}
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium">
                {t('events_date_end')}
              </p>
              <p
                className={`text-[15px] font-medium truncate ${
                  endDisplayDate ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {formatRangeDate(endDisplayDate)}
              </p>
            </div>
            <p
              className={`text-[15px] font-medium tabular-nums shrink-0 ${
                endDisplayDate ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              {endDisplayDate ? formatRangeTime(endTime) : '—'}
            </p>
          </div>
        </div>
      </div>

      {durationLabel ? (
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/80 text-xs text-gray-500 font-medium">
          {durationLabel}
        </div>
      ) : null}
    </>
  );

  if (startCollapsed) {
    return (
      <div className="w-full">
        <button
          type="button"
          data-testid="dates"
          onClick={() => setIsExpanded(true)}
          className="w-full text-left rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {rangeSummaryContent}
        </button>

        {timeZone ? (
          <p className="mt-2 px-1 text-xs text-gray-400">
            {timeZone} {t('events_time')}
          </p>
        ) : null}

        {isExpanded ? (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            aria-modal
            role="dialog"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setIsExpanded(false)}
              aria-hidden
            />
            <div className="relative z-10 w-full sm:max-w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-white/95 backdrop-blur">
                <h3 className="text-base font-semibold text-gray-900">
                  {t('events_date_time_title')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-sm font-medium text-accent hover:text-accent-dark px-2 py-1 rounded-lg"
                >
                  {t('generic_done')}
                </button>
              </div>

              <div className="px-4 pt-3 pb-2 flex justify-center [&_.rdp]:m-0 [&_.rdp]:p-0 [&_.rdp-months]:justify-center [&_.rdp-caption_label]:font-semibold [&_.rdp-day_selected]:!bg-accent [&_.rdp-day_selected]:!text-white [&_.rdp-day_range_middle]:!bg-accent/15 [&_.rdp-day_range_middle]:!text-foreground [&_.rdp-day_range_start]:!bg-accent [&_.rdp-day_range_end]:!bg-accent [&_.rdp-button:hover]:!bg-accent/10">
                <DayPicker
                  disabled={normalizeBlockedDateRangesForDayPicker(
                    blockedDateRanges,
                  )}
                  mode="range"
                  defaultMonth={defaultMonth}
                  numberOfMonths={1}
                  onSelect={handleSelectDay}
                  selected={dateRange}
                />
              </div>
              {dateError && (
                <div className="px-5">
                  <ErrorMessage error={dateError} />
                </div>
              )}

              <div className="px-5 pb-5 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium">
                      {t('events_date_start')}
                    </span>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      disabled={!Boolean(dateRange?.from)}
                      onChange={handleTimeChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-40"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-gray-400 font-medium">
                      {t('events_date_end')}
                    </span>
                    <input
                      type="time"
                      id="endTime"
                      value={endTime}
                      disabled={!Boolean(dateRange?.to)}
                      onChange={handleTimeChange}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-40"
                    />
                  </label>
                </div>

                {timeZone ? (
                  <p className="text-xs text-gray-400">
                    {timeZone} {t('events_time')}
                  </p>
                ) : null}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2"
                  >
                    {t('generic_clear_selection')}
                  </button>
                  <Button
                    type="button"
                    size="small"
                    isFullWidth={false}
                    className="btn-primary !rounded-full !px-5"
                    onClick={() => setIsExpanded(false)}
                  >
                    {t('generic_done')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {!hideSelectionSummary && (
        <div
          data-testid="dates"
          className="w-full flex flex-wrap items-center gap-2 mb-2"
        >
          <div className="flex flex-wrap gap-2 items-center">
            {priceDuration !== 'night' && startTime && savedStartDate && (
              <div className={dateTagClass}>
                {getDateOnly(savedStartDate)}
                {isStartTimeSelected &&
                  startTimeOnly !== endTimeOnly &&
                  ` – ${startTimeOnly}–${endTimeOnly}`}
              </div>
            )}
            {priceDuration === 'night' && (
              <>
                <div className={`${dateTagClass} flex-col gap-0.5 min-w-0`}>
                  {isAdmin && !showCalendar && (
                    <span className="text-foreground/60 text-xs">
                      {t('events_event_start_date')}
                    </span>
                  )}
                  {dateRange?.from ? (
                    <>
                      <span className="md:hidden">
                        {isAdmin && !showCalendar && startTime
                          ? dayjs(dateRange.from).format('ddd, MMM D') +
                            ' at ' +
                            startTime
                          : dayjs(dateRange.from).format('ddd, MMM D')}
                      </span>
                      <span className="hidden md:inline">
                        {isAdmin && !showCalendar && startTime
                          ? dayjs(dateRange.from).format('ddd, MMM D, YYYY') +
                            ' at ' +
                            startTime
                          : dayjs(dateRange.from).format('ddd, MMM D, YYYY')}
                      </span>
                    </>
                  ) : (
                    t('listings_book_select_date')
                  )}
                </div>
                <div className={`${dateTagClass} flex-col gap-0.5 min-w-0`}>
                  {isAdmin && !showCalendar && (
                    <span className="text-foreground/60 text-xs">
                      {t('events_event_end_date')}
                    </span>
                  )}
                  {dateRange?.to ? (
                    <>
                      <span className="md:hidden">
                        {isAdmin && !showCalendar && endTime
                          ? dayjs(dateRange.to).format('ddd, MMM D') +
                            ' at ' +
                            endTime
                          : dayjs(dateRange.to).format('ddd, MMM D')}
                      </span>
                      <span className="hidden md:inline">
                        {isAdmin && !showCalendar && endTime
                          ? dayjs(dateRange.to).format('ddd, MMM D, YYYY') +
                            ' at ' +
                            endTime
                          : dayjs(dateRange.to).format('ddd, MMM D, YYYY')}
                      </span>
                    </>
                  ) : (
                    t('listings_book_select_date')
                  )}
                </div>
                {durationLabel && (
                  <span className={durationTagClass}>{durationLabel}</span>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearDates}
            className="text-xs text-foreground/60 hover:text-foreground underline py-1 px-1.5 min-w-0"
          >
            {t('generic_clear_selection')}
          </button>
        </div>
      )}

      {showCalendar && (
        <>
          <div
            className={
              compactCalendar
                ? 'w-fit max-w-full [&_.rdp]:p-0 [&_.rdp-months]:gap-3 [&_.rdp-month]:m-0'
                : 'mt-2'
            }
          >
            <DayPicker
              disabled={normalizeBlockedDateRangesForDayPicker(blockedDateRanges)}
              mode="range"
              defaultMonth={defaultMonth}
              numberOfMonths={isOneMonthCalendar ? 1 : 2}
              onSelect={handleSelectDay}
              selected={dateRange}
            />
            {dateError && <ErrorMessage error={dateError} />}

            {isAdmin && (
              <div>
                <div className="text-sm mb-2 flex">
                  <div className="w-[136px] mr-2">
                    <Input
                      label={t('events_event_start_time')}
                      value={startTime}
                      isDisabled={!Boolean(dateRange?.from)}
                      type="time"
                      id="startTime"
                      onChange={handleTimeChange}
                    />
                  </div>
                  <div className="w-[136px]">
                    <Input
                      label={t('events_event_end_time')}
                      value={endTime}
                      isDisabled={!Boolean(dateRange?.to)}
                      type="time"
                      id="endTime"
                      onChange={handleTimeChange}
                    />
                  </div>
                </div>
                <div className="text-sm mt-4">
                  {timeZone} {t('events_time')}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {priceDuration !== 'night' && showCalendar && (
        <div className="py-2 border-t">
          <TimePicker
            startDate={savedStartDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            hourAvailability={hourAvailability}
          />
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
