import React, { ChangeEvent, FC, useEffect, useState } from 'react';

import dayjs from 'dayjs';

const defaultTime = dayjs().add(7, 'days').set('hour', 12).set('minute', 0);

interface Props {
  value?: string;
  minValue?: string;
  maxValue?: string;
  onChange: (date: dayjs.Dayjs) => void;
  showTime?: boolean;
}
const DatePickerAdmin: FC<Props> = ({
  value,
  minValue,
  maxValue = '180',
  onChange,
  showTime = false,
}) => {
  const [datetime, updateTime] = useState(value ? dayjs(value) : defaultTime);

  useEffect(() => {
    updateTime(value ? dayjs(value) : defaultTime);
  }, [value]);

  const onDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newDate = dayjs(e.target.value, 'YYYY-MM-DD')
      .set('hour', datetime.get('hour'))
      .set('minute', datetime.get('minute'));
    updateTime(newDate);
    onChange(newDate);
  };

  const onTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hour, minute] = e.target.value.split(':').map((n) => Number(n));
    const newDate = datetime.set('hour', hour).set('minute', minute);
    updateTime(newDate);
    onChange(newDate);
  };

  return (
    <div>
      <div className={`${showTime ? 'flex cols-2' : ''}`}>
        <input
          type="date"
          value={datetime.format('YYYY-MM-DD')}
          min={minValue}
          max={maxValue}
          placeholder="01/01/1975"
          onChange={onDateChange}
          className="peer invalid:text-primary flex-grow"
        />
        {showTime && (
          <input
            type="time"
            value={datetime.format('HH:mm')}
            placeholder="14:20"
            onChange={onTimeChange}
            className="ml-2"
          />
        )}
      </div>
    </div>
  );
};


export default DatePickerAdmin;