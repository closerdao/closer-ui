import { ChangeEvent, FC, useEffect, useState } from 'react';
import { DateRange, DayPicker } from 'react-day-picker';
// import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

import dayjs from 'dayjs';

import '../public/css/react-day-picker.css';

const defaultTime = dayjs().add(7, 'days').set('hour', 12).set('minute', 0);

interface Props {
  value?: string;
  minValue?: string;
  maxValue?: string;
  onChange: (date: dayjs.Dayjs) => void;
  showTime?: boolean;
  blockedDateRanges: (Date | {
    from: Date;
    to: Date;
})[]
}
const DateTimePicker: FC<Props> = ({
  value,
  minValue,
  maxValue = '180',
  onChange,
  showTime,
  blockedDateRanges,
}) => {
  const [datetime, updateTime] = useState(value ? dayjs(value) : defaultTime);

  const [date, setDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // const disabledDays = [
  //   new Date(2022, 5, 10),
  //   new Date(2022, 5, 12),
  //   new Date(2022, 5, 20),
  //   { from: new Date('2023-05-14'), to: new Date('2023-05-16') },
  // ];

  useEffect(() => {
    console.log('range=', dateRange);
  }, [dateRange]);

  useEffect(() => {
    updateTime(value ? dayjs(value) : defaultTime);
  }, [value]);

  // const onDateChange = (e: any) => {
  //   const newDate = dayjs(e.target.value, 'YYYY-MM-DD')
  //     .set('hour', datetime.get('hour'))
  //     .set('minute', datetime.get('minute'));
  //   updateTime(newDate);
  //   onChange(newDate);
  // };

  const onDateChange = (e: any) => {
    console.log(e);
    // const newDate = dayjs(e.target.value, 'YYYY-MM-DD')
    //   .set('hour', datetime.get('hour'))
    //   .set('minute', datetime.get('minute'));
    // updateTime(newDate);
    // onChange(e.target.value);
  };

  const onTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const [hour, minute] = e.target.value.split(':').map((n) => Number(n));
    const newDate = datetime.set('hour', hour).set('minute', minute);
    updateTime(newDate);
    onChange(newDate);
  };


  const handleSetRange = (range:DateRange | undefined) => {
    setDateRange(range)
  }

  return (
    <div>
      {JSON.stringify(blockedDateRanges)}
      <DayPicker
        disabled={blockedDateRanges}
        mode="range"
        defaultMonth={new Date()}
        // numberOfMonths={2}
        onSelect={handleSetRange}
        selected={dateRange}

      />

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

DateTimePicker.defaultProps = {
  showTime: true,
};

export default DateTimePicker;
