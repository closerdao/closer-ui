import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  getDateOnly,
  getDateStringWithoutTimezone,
  getTimeOnly,
} from '../../utils/booking.helpers';

dayjs.extend(timezone);
dayjs.extend(utc);

interface Props {
  startDate: Date | string | null | undefined;
  endDate: Date | string | null | undefined;
  setStartDate: (date: any) => void;
  setEndDate: (date: any) => void;
  timeOptions?: string[] | null;
  hourAvailability?: { hour: string; isAvailable: boolean }[] | [];
}

const TimePicker = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  timeOptions,
  hourAvailability,
}: Props) => {
  const startTime = timeOptions?.includes(String(getTimeOnly(startDate)))
    ? getTimeOnly(startDate)
    : null;
  const endTime = timeOptions?.includes(String(getTimeOnly(endDate)))
    ? getTimeOnly(endDate)
    : null;

  const [updatedHourAvailability, setUpdatedHourAvailability] =
    useState(hourAvailability);

  useEffect(() => {
    if (!startTime) {
      setUpdatedHourAvailability(hourAvailability);
      return;
    }
    const currentIndex =
      hourAvailability?.findIndex((time) => time.hour === startTime) || 0;

    let shouldBlockSubsequentTimes = false;

    const indexOfFirstUnavailable = hourAvailability?.findIndex(
      (time, index) => time.isAvailable === false && index > currentIndex,
    );

    const updated = hourAvailability?.map((time, index) => {
      const isNexSlotUnavailable =
        hourAvailability[index]?.isAvailable === false;

      shouldBlockSubsequentTimes =
        currentIndex <
          (indexOfFirstUnavailable || hourAvailability.length - 1) &&
        (index || 0) > (indexOfFirstUnavailable || hourAvailability.length - 1);
      if (isNexSlotUnavailable || shouldBlockSubsequentTimes) {
        return {
          ...time,
          isAvailable: false,
        };
      }
      return time;
    });

    setUpdatedHourAvailability(updated);
  }, [startTime, startDate, hourAvailability]);

  const getCellStyle = (time: string, isAvailable: boolean) => {
    if (!isAvailable || !startDate) {
      return 'text-gray-400';
    }
    if (startTime && endTime && time === startTime) {
      return 'bg-accent text-white rounded-md';
    }
    if (startTime && endTime && time > startTime && time < endTime) {
      return 'bg-accent text-white rounded-md';
    }
  };

  const handleUpdateTime = (time: string) => {
    const startDateOnly = dayjs(startDate).format('YYYY-MM-DD');
    const localStartDateTime = getDateStringWithoutTimezone(
      startDateOnly,
      time,
    );
    const timePlusOneHour = getDateStringWithoutTimezone(
      startDateOnly,
      String(Number(time.substring(0, 2)) + 1 + ':00'),
    );

    if (!startTime && !endTime) {
      setStartDate(localStartDateTime);
      setEndDate(timePlusOneHour);
    }

    if (startTime && endTime && time < startTime) {
      setStartDate(localStartDateTime);
      setEndDate(timePlusOneHour);
    }

    if (startTime && endTime && time >= endTime) {
      setEndDate(timePlusOneHour);
    }

    if (startTime && endTime && time >= startTime && time < endTime) {
      setStartDate((start: Date | string | null) => getDateOnly(start));
      setEndDate((end: Date | string | null) => getDateOnly(end));
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-5">
        {updatedHourAvailability?.map((time) => {
          return (
            <button
              disabled={!time.isAvailable || !startDate}
              onClick={() => handleUpdateTime(time.hour)}
              key={time.hour}
              className={`${getCellStyle(
                time.hour,
                time.isAvailable,
              )} p-1 text-center text-sm`}
            >
              {time.hour} - {Number(time.hour.substring(0, 2)) + 1 + ':00'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimePicker;
