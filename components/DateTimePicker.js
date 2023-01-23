import React from 'react';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import DatePicker from 'react-date-picker/dist/entry.nostyle';

import dayjs from 'dayjs';

const DateTimePicker = ({
  value,
  minValue,
  maxValue,
  onChange,
  disabledDates,
}) => {
  const handleChange = (date) => {
    onChange(date);
  };

  const disableTile = ({ date, view }) => {
    if (view !== 'month' || !disabledDates) {
      return false;
    }

    const disabledDayJSDates = disabledDates.map(dayjs);
    return disabledDayJSDates.some((disabledDate) => {
      return dayjs(disabledDate).isSame(dayjs(date), 'day');
    });
  };

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <div>
      <DatePicker
        minDate={minValue}
        maxDate={maxValue}
        value={value}
        onChange={handleChange}
        className="datepicker"
        clearIcon={null}
        format="dd/MM/y"
        tileDisabled={disableTile}
        tileContent={({ date, view }) => {
          if (
            view === 'month' &&
            disabledDates.some((d) => dayjs(d).isSame(date, 'day'))
          ) {
            return (
              <div className="w-full h-full relative">
                <span
                  className="bg-primary w-full h-full absolute block top-1"
                  title="you already booked these dates"
                ></span>
              </div>
            );
          }
          return null;
        }}
      />

      <p className="mt-2 invisible peer-invalid:visible text-primary text-sm">
        Please set a valid date.
      </p>
    </div>
  );
};

export default DateTimePicker;
