import { FC, ReactNode, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';

import { __ } from '../utils/helpers';
import { ErrorMessage } from './ui';

interface Props {
  value?: string;
  minValue?: string | null;
  maxValue?: string | null;
  setStartDate: (date: string | null) => void;
  setEndDate: (date: string | null) => void;
  maxDuration?: number;
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
const DateTimePicker: FC<Props> = ({
  setStartDate,
  setEndDate,
  maxDuration,
  blockedDateRanges,
  savedStartDate,
  savedEndDate,
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateError, setDateError] = useState<ReactNode | null | string>(null);
  const [isOneMonthCalendar, setIsOneMonthCalendar] = useState(false);
  const [blockedMaxDurationRange, setBlockedMaxDurationRange] = useState<
    ({ after: Date } | { before: Date })[] | []
  >([]);

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
    }
  }, [savedStartDate, savedEndDate]);

  const includesBlockedDateRange = (range: DateRange | undefined) => {
    if (range) {
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

  const handleSelectDay = (range: DateRange | undefined) => {
    if (range?.from?.toString() == range?.to?.toString()) {
      setDateRange({ from: undefined, to: undefined });
      return;
    }
    setDateError(null);
    if (!includesBlockedDateRange(range)) {
      setDateRange(range);

      if (range?.from && !range?.to && maxDuration) {
        setBlockedMaxDurationRange([
          {
            before: new Date(
              new Date(range?.from).setDate(
                new Date(range?.from).getDate() - maxDuration,
              ),
            ),
          },
          {
            after: new Date(
              new Date(range?.from).setDate(
                new Date(range?.from).getDate() + maxDuration,
              ),
            ),
          },
        ]);
      } else if (range?.from && range?.to && maxDuration) {
        setBlockedMaxDurationRange([
          {
            before: new Date(
              new Date(range?.to).setDate(
                new Date(range?.to).getDate() - maxDuration,
              ),
            ),
          },
          {
            after: new Date(
              new Date(range?.from).setDate(
                new Date(range?.from).getDate() + maxDuration,
              ),
            ),
          },
        ]);
      } else {
        setBlockedMaxDurationRange([]);
      }

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
      setDateError(
        'Please make separate bookings if you would like to stay before and after events',
      );
    }
  };

  return (
    <div className="">
      <div className="border-2 py-3 px-8 rounded-full w-full bg-neutral mb-8">
        <span>
          {dateRange?.from
            ? dayjs(dateRange?.from).format('LL')
            : __('listings_book_check_in')}{' '}
          —{' '}
        </span>
        <span>
          {dateRange?.to
            ? dayjs(dateRange?.to).format('LL')
            : __('listings_book_check_out')}
        </span>
      </div>

      <div className="">
        <DayPicker
          disabled={[...blockedDateRanges, ...blockedMaxDurationRange]}
          mode="range"
          defaultMonth={new Date()}
          numberOfMonths={isOneMonthCalendar ? 1 : 2}
          onSelect={handleSelectDay}
          selected={dateRange}
        />
        {dateError && <ErrorMessage error={dateError} />}
      </div>
    </div>
  );
};

export default DateTimePicker;
