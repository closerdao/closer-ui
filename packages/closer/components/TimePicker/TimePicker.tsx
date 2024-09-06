import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import {
  addOneHour,
  getDateOnly,
  getDateStringWithoutTimezone,
} from '../../utils/booking.helpers';

dayjs.extend(timezone);
dayjs.extend(utc);

interface Props {
  startDate: Date | string | null | undefined;
  setStartDate: (date: any) => void;
  setEndDate: (date: any) => void;
  hourAvailability?: { hour: string; isAvailable: boolean }[] | [];
}

const TimePicker = ({
  startDate,
  setStartDate,
  setEndDate,
  hourAvailability,
}: Props) => {
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

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
      (time, index) => {
        return time.isAvailable === false && index >= currentIndex;
      },
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
    const datePlusOneHour = getDateStringWithoutTimezone(
      startDateOnly,
      addOneHour(time),
    );

    if (
      (!startTime && !endTime) ||
      (startTime && endTime && time < startTime)
    ) {
      setStartTime(time);
      setEndTime(addOneHour(time));
      setStartDate(localStartDateTime);
      setEndDate(datePlusOneHour);
    }

    if (startTime && endTime && time >= endTime) {
      setEndTime(addOneHour(time));
      setEndDate(datePlusOneHour);
    }

    if (startTime && endTime && time >= startTime && time < endTime) {
      setStartTime(null);
      setEndTime(null);
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
