import { DateRange } from 'react-day-picker';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getDateTime = (
  date: string | Date,
  hours: number,
  minutes: number,
  timeZone?: string,
) => {
  if (timeZone) {
    // Create datetime in the specified timezone
    const baseDate = dayjs(date);
    const dateTimeString = `${baseDate.format('YYYY-MM-DD')}T${hours
      .toString()
      .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    return dayjs.tz(dateTimeString, timeZone).toDate();
  } else {
    // Fallback to original behavior (browser local timezone)
    return new Date(
      new Date(date).getFullYear(),
      new Date(date).getMonth(),
      new Date(date).getDate(),
      hours,
      minutes,
    );
  }
};

export const includesBlockedDateRange = (
  range: DateRange | undefined,
  blockedDateRanges: (Date | { from: Date; to: Date })[] | undefined,
) => {
  if (range && blockedDateRanges) {
    return blockedDateRanges.some((blockedDateRange) => {
      if (!(blockedDateRange instanceof Date) && range.from && range.to) {
        return (
          blockedDateRange.from >= range.from && blockedDateRange.to <= range.to
        );
      }
      if (blockedDateRange instanceof Date && range.from && range.to) {
        return blockedDateRange >= range.from && blockedDateRange <= range.to;
      }
    });
  }
  return false;
};

export const checkDefaultDatesAreAvailable = (
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

export const getBlockedDays = (dateArray: any[]) => {
  return dateArray
    ?.map((date) => {
      if (date instanceof Date) {
        return date;
      }
      return null;
    })
    .filter((date) => date !== null);
};

export type BlockedDateRangeInput =
  | Date
  | { from: Date; to: Date }
  | { before?: string | number | Date; after?: string | number | Date };

export const normalizeBlockedDateRangesForDayPicker = (
  blockedDateRanges: BlockedDateRangeInput[] | undefined,
): (Date | { from: Date; to: Date } | { before: Date } | { after: Date })[] => {
  if (!blockedDateRanges?.length) return [];
  return blockedDateRanges
    .map((item) => {
      if (item instanceof Date) return item;
      if ('from' in item && 'to' in item && item.from && item.to) {
        return { from: new Date(item.from), to: new Date(item.to) };
      }
      if ('before' in item && item.before != null) {
        return { before: new Date(item.before) };
      }
      if ('after' in item && item.after != null) {
        return { after: new Date(item.after) };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};
