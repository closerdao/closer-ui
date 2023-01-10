import React from 'react';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import DatePicker from 'react-date-picker/dist/entry.nostyle';

const DateTimePicker = ({ value, minValue, maxValue = '180', onChange }) => {
  const handleChange = (date) => {
    onChange(date);
  };

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
      />

      <p className="mt-2 invisible peer-invalid:visible text-primary text-sm">
        Please set a valid date.
      </p>
    </div>
  );
};

export default DateTimePicker;
