import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';

const defaultTime = dayjs().add(7, 'days').set('hour', 12).set('minute', 0);

const DateTimePicker = ({ value, onChange, showTime }) => {
  const [datetime, updateTime] = useState(value ? dayjs(value) : defaultTime);

  useEffect(() => {
    updateTime(value ? dayjs(value) : defaultTime);
  }, [value]);

  return (
    <div className={`${showTime ? 'columns-2' : ''}`}>
      <input
        type="date"
        value={datetime.format('YYYY-MM-DD')}
        placeholder="01/01/1975"
        onChange={(e) => {
          const newDate = dayjs(e.target.value)
            .set('hour', datetime.get('hour'))
            .set('minute', datetime.get('minute'));
          updateTime(newDate);
          onChange(newDate);
        }}
      />
      {showTime && (
        <input
          type="time"
          value={datetime.format('HH:mm')}
          placeholder="14:20"
          onChange={(e) => {
            const [hour, minute] = e.target.value
              .split(':')
              .map((n) => Number(n));

            const newDate = datetime.set('hour', hour).set('minute', minute);
            updateTime(newDate);
            onChange(newDate);
          }}
        />
      )}
    </div>
  );
};

DateTimePicker.defaultProps = {
  showTime: true,
};

export default DateTimePicker;
