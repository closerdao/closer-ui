import { DateRange } from 'react-day-picker';

export const getDateTime = (
  date: string | Date,
  hours: number,
  minutes: number,
) => {
  return new Date(
    new Date(date).getFullYear(),
    new Date(date).getMonth(),
    new Date(date).getDate(),
    hours,
    minutes,
  );
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
