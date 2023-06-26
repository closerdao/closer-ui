import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';

import { __ } from '../../utils/helpers';
import { ErrorMessage } from '../ui';

interface Props {
  value?: string;
  minValue?: string | null;
  maxValue?: string | null;
  setStartDate: (date: string | null) => void | Dispatch<SetStateAction<string | undefined>>;
  setEndDate: (date: string | null) => void  | Dispatch<SetStateAction<string | undefined>>;
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
  defaultMonth?: Date;
}
const DateTimePicker = ({
  setStartDate,
  setEndDate,
  maxDuration,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
  defaultMonth,
}: Props) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateError, setDateError] = useState<null | string>(null);
  const [isOneMonthCalendar, setIsOneMonthCalendar] = useState(false);

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
    if (savedStartDate && savedEndDate) {
      handleSelectDay(dateRange);
      setEndDate(savedEndDate);
      setStartDate(savedStartDate);
      setDateRange({
        from: new Date(savedStartDate),
        to: new Date(savedEndDate),
      });
    }
    if (!savedStartDate && !savedEndDate) {
      setEndDate('');
      setStartDate('');
      setDateRange({
        from: undefined,
        to: undefined,
      });
    }
  }, [savedStartDate, savedEndDate]);

  const includesBlockedDateRange = (range: DateRange | undefined) => {
    if (range) {
      return blockedDateRanges?.some((blockedDateRange) => {
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

  const handleSelectDay = (range: DateRange | undefined) => {
    setDateError(null);
    if (range?.from?.toString() == range?.to?.toString()) {
      setEndDate('');
      setStartDate('');
      setDateRange({ from: undefined, to: undefined });
      return;
    }
    if (!includesBlockedDateRange(range)) {
      setDateRange(range);

      if (range?.to) {
        setEndDate(dayjs(range?.to).format('YYYY-MM-DD'));
      } else {
        setEndDate(null);
      }
      if (range?.from) {
        setStartDate(dayjs(range?.from).format('YYYY-MM-DD'));
      } else {
        setStartDate(null);
      }
    } else {
      // TODO: decide if we allow  members to book during events / edit error message
      setDateError(
        'Please make separate bookings if you would like to stay before and after events',
      );
    }
  };

  return (
    <div className="">
      <div data-testid="dates" className="w-full flex mb-8">
        <div>
          <div className="text-sm mb-2">{__('listings_book_check_in')}</div>
          <div className="text-sm border bordr-disabled rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
            {dateRange?.from
              ? dayjs(dateRange?.from).format('LL')
              : __('listings_book_select_date')}{' '}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">{__('listings_book_check_out')}</div>
          <div className="text-sm border bordr-disabled rounded-md bg-neutral py-3 px-4 font-bold mr-2 w-[136px]">
            {dateRange?.to
              ? dayjs(dateRange?.to).format('LL')
              : __('listings_book_select_date')}
          </div>
        </div>
      </div>

      <div className="">
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
      </div>
    </div>
  );
};

export default DateTimePicker;
