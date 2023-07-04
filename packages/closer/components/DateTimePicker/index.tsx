import { useRouter } from 'next/router';

import { ChangeEventHandler, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';

import { __ } from '../../utils/helpers';
import { ErrorMessage, Input } from '../ui';

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
  savedStartDate?: string;
  savedEndDate?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  defaultMonth?: Date;
  isAdmin?: boolean;
}

const DateTimePicker = ({
  setStartDate,
  setEndDate,
  maxDuration,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
  eventStartDate,
  eventEndDate,
  defaultMonth,
  isAdmin,
}: Props) => {
  const router = useRouter();
  const { volunteerId } = router.query;
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateError, setDateError] = useState<null | string>(null);
  const [isOneMonthCalendar, setIsOneMonthCalendar] = useState(false);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:00');

  const [isDateRangeSet, setIsDateRangeSet] = useState(false);

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

  useEffect(() => {
    if (savedStartDate && savedEndDate && !volunteerId) {
      if (!isDateRangeSet) {
        setDateRange({
          from: new Date(savedStartDate),
          to: new Date(savedEndDate),
        });
        if (isAdmin) {
          setEndTime(dayjs(savedEndDate).format('HH:mm'));
          setStartTime(dayjs(savedStartDate).format('HH:mm'));
        }
      }
      setIsDateRangeSet(true);
    }
  }, [savedStartDate, savedEndDate]);

  useEffect(() => {
    if (eventStartDate && eventEndDate) {
      if (!isDateRangeSet) {
        setDateRange({
          from: new Date(eventStartDate),
          to: new Date(eventEndDate),
        });
        setStartDate(eventStartDate);
        setEndDate(eventEndDate);
        updateDateRange({
          from: new Date(eventStartDate),
          to: new Date(eventEndDate),
        })
      }
      setIsDateRangeSet(true);
    }
  }, [eventStartDate, eventEndDate]);

  const getDateTime = (date: string | Date, hours: number, minutes: number) => {
    return new Date(
      new Date(date).getFullYear(),
      new Date(date).getMonth(),
      new Date(date).getDate(),
      hours,
      minutes,
    );
  };

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
      );
      setStartDate(formattedDate);
      setStartTime(dayjs(formattedDate).format('HH:mm'));
    }
    if (event.target.id === 'endTime') {
      const formattedDate = getDateTime(savedEndDate as string, hours, minutes);
      setEndDate(formattedDate);
      setEndTime(dayjs(formattedDate).format('HH:mm'));
    }
  };

  const includesBlockedDateRange = (range: DateRange | undefined) => {
    if (range && blockedDateRanges) {
      return blockedDateRanges.some((blockedDateRange) => {
        if (!(blockedDateRange instanceof Date) && range.from && range.to) {
          return (
            blockedDateRange.from >= range.from &&
            blockedDateRange.to <= range.to
          );
        }
      });
    }
    return false;
  };

  const updateDateRange = (range: DateRange | undefined) => { 
    if (!includesBlockedDateRange(range)) {
      setDateRange(range);
      if (range?.to) {
        if (endTime === '12:00') {
          const formattedDate = getDateTime(range?.to, 12, 0);
          setEndDate(formattedDate);
        } else {
          setEndDate(range?.to);
        }
      } else {
        setEndDate(null);
      }
      if (range?.from) {
        if (startTime === '12:00') {
          const formattedDate = getDateTime(range?.from, 12, 0);
          setStartDate(formattedDate);
        } else {
          setStartDate(range?.from);
        }
      } else {
        setStartDate(null);
      }
    }
  }

  const handleSelectDay = (range: DateRange | undefined) => {
    setDateError(null);
    updateDateRange(range);
  };

  return (
    <div className="">
      <div data-testid="dates" className="w-full flex mb-8">
        <div>
          <div className="text-sm mb-2">
            {isAdmin
              ? __('events_event_start_date')
              : __('listings_book_check_in')}
          </div>
          <div className="text-sm border rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
            {dateRange?.from
              ? dayjs(dateRange?.from).format('ll')
              : __('listings_book_select_date')}{' '}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">
            {isAdmin
              ? __('events_event_end_date')
              : __('listings_book_check_out')}
          </div>
          <div className="text-sm border bordr-disabled rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
            {dateRange?.to
              ? dayjs(dateRange?.to).format('ll')
              : __('listings_book_select_date')}
          </div>
        </div>
      </div>

      <div>
        <DayPicker
          disabled={blockedDateRanges ? [...blockedDateRanges] : []}
          mode="range"
          defaultMonth={defaultMonth}
          numberOfMonths={isOneMonthCalendar ? 1 : 2}
          onSelect={handleSelectDay}
          selected={dateRange}
          max={maxDuration}
        />
        {dateError && <ErrorMessage error={dateError} />}

        {isAdmin && (
          <div>
            <div className="text-sm mb-2 flex">
              <div className="w-[136px] mr-2">
                <Input
                  label={__('events_event_start_time')}
                  value={startTime}
                  isDisabled={!Boolean(dateRange?.from)}
                  type="time"
                  id="startTime"
                  onChange={handleTimeChange}
                />
              </div>
              <div className="w-[136px]">
                <Input
                  label={__('events_event_end_time')}
                  value={endTime}
                  isDisabled={!Boolean(dateRange?.to)}
                  type="time"
                  id="endTime"
                  onChange={handleTimeChange}
                />
              </div>
            </div>
            <div className="text-sm mt-4">
              {localTimezone} {__('events_time')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimePicker;
