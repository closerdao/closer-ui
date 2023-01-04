import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';

const defaultTime = dayjs().add(7, 'days').set('hour', 12).set('minute', 0);

const DateTimePicker = ({
  value,
  minValue,
  maxValue = '180',
  onChange,
}) => {
  const [datetime, updateTime] = useState(value ? dayjs(value) : defaultTime);

  useEffect(() => {
    updateTime(value ? dayjs(value) : defaultTime);
  }, [value]);

  return (
    <div className={`${showTime ? 'columns-2' : ''}`}>
      <input
        type="date"
        value={datetime.format('YYYY-MM-DD')}
        min={minValue}
        max={maxValue}
        placeholder="01/01/1975"
        onChange={(e) => {
          const newDate = dayjs(e.target.value)
            .set('hour', datetime.get('hour'))
            .set('minute', datetime.get('minute'));
          updateTime(newDate);
          onChange(newDate);
        }}
        className="peer invalid:text-primary invalid:border-primary focus:invalid:text-primary focus:invalid:border-primary"
      />
      <p className="mt-2 invisible peer-invalid:visible text-primary text-sm">
        Please set a valid date.
      </p>
    </div>
  );
};

export default DateTimePicker;
