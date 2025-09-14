import { useRouter } from 'next/router';

import { ChangeEventHandler, FormEvent, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { getDateOnly, getTimeOnly } from '../../utils/booking.helpers';
import TimePicker from '../TimePicker';
import { Button, ErrorMessage, Input } from '../ui';
import { getDateTime, includesBlockedDateRange } from './dateTimePicker.utils';

interface Props {
  value?: string;
  minValue?: string | null;
  maxValue?: string | null;
  setStartDate: (date: string | null | Date) => void;
  setEndDate: (date: string | null | Date) => void;
  maxDuration?: number;
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
}: Props) => {
  // Store the original full dates for timezone conversion
  const originalStartDate = savedStartDate;
  const originalEndDate = savedEndDate;

  // Convert to date-only for calendar display
  savedStartDate = getDateOnly(savedStartDate);
  savedEndDate = getDateOnly(savedEndDate);

  const t = useTranslations();
  const router = useRouter();
  const { volunteerId, bookingType } = router.query;
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    const initialTime =
      getTimeInTimezone(originalStartDate, timeZone) || '12:00';
    console.log(
      'DateTimePicker initial state: originalStartDate=',
      originalStartDate,
      'timeZone=',
      timeZone,
      'initialTime=',
      initialTime,
    );
    return initialTime;
  });
  const [endTime, setEndTime] = useState(() => {
    const initialTime = getTimeInTimezone(originalEndDate, timeZone) || '12:00';
    console.log(
      'DateTimePicker initial state: originalEndDate=',
      originalEndDate,
      'timeZone=',
      timeZone,
      'initialTime=',
      initialTime,
    );
    return initialTime;
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

    console.log(
      'DateTimePicker: originalStartDate=',
      originalStartDate,
      'timeZone=',
      timeZone,
      'newStartTime=',
      newStartTime,
    );

    if (newStartTime) {
      console.log('Setting startTime to:', newStartTime);
      setStartTime(newStartTime);
    }
    if (newEndTime) {
      console.log('Setting endTime to:', newEndTime);
      setEndTime(newEndTime);
    }
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

  return (
    <div className="max-w-[550px]">
      <div data-testid="dates" className="w-full flex mb-8 justify-between">
        <div className="flex">
          {priceDuration !== 'night' && startTime && savedStartDate && (
            <div className="text-sm border rounded-md bg-neutral py-3 px-4 font-bold ">
              {getDateOnly(savedStartDate)}
              {isStartTimeSelected &&
                startTimeOnly !== endTimeOnly &&
                ` - ${startTimeOnly} - ${endTimeOnly}`}
            </div>
          )}
          {priceDuration === 'night' && (
            <>
              <div>
                {!isDashboard && (
                  <div className="text-sm mb-2">
                    {isAdmin
                      ? t('events_event_start_date')
                      : t('listings_book_check_in')}
                  </div>
                )}
                <div className="text-sm border rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
                  {dateRange?.from
                    ? dayjs(dateRange?.from).format('ll')
                    : t('listings_book_select_date')}{' '}
                </div>
              </div>
              <div>
                {!isDashboard && (
                  <div className="text-sm mb-2">
                    {isAdmin
                      ? t('events_event_end_date')
                      : t('listings_book_check_out')}
                  </div>
                )}
                <div className="text-sm border rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
                  {dateRange?.to
                    ? dayjs(dateRange?.to).format('ll')
                    : t('listings_book_select_date')}
                </div>
              </div>
            </>
          )}
        </div>
        <Button
          className="hidden sm:block sm:font-normal h-[25px] w-[130px] underline sm:no-underline text-black border-0 sm:border-2 border-black normal-case py-0.5 px-0 sm:px-3 sm:p-3 sm:py-2 text-sm bg-white"
          onClick={handleClearDates}
        >
          {t('generic_clear_selection')}
        </Button>
      </div>

      <div>
        <DayPicker
          disabled={blockedDateRanges || []}
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
                {(() => {
                  console.log(
                    'Rendering startTime input with value:',
                    startTime,
                    'dateRange?.from:',
                    dateRange?.from,
                    'isDisabled:',
                    !Boolean(dateRange?.from),
                  );
                  return null;
                })()}
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
      {priceDuration !== 'night' && (
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
