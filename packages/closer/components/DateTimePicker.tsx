import { ChangeEvent, FC, useEffect, useState } from 'react';




import dayjs from 'dayjs';
import { DayPicker, DateRange } from 'react-day-picker';
// import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

const defaultTime = dayjs().add(7, 'days').set('hour', 12).set('minute', 0);

interface Props {
  value?: string;
  minValue?: string;
  maxValue?: string;
  onChange: (date: dayjs.Dayjs) => void;
  showTime?: boolean;
  blockedDateRanges: { start: Date; end: Date }[];
}
const DateTimePicker: FC<Props> = ({
  value,
  minValue,
  maxValue = '180',
  onChange,
  showTime,
  blockedDateRanges
}) => {
  const [datetime, updateTime] = useState(value ? dayjs(value) : defaultTime);

  const [date, setDate] = useState(new Date());
  const [range, setRange] = useState<DateRange | undefined>();

  const disabledDays = [
    new Date(2022, 5, 10),
    new Date(2022, 5, 12),
    new Date(2022, 5, 20),
    { from: new Date(2022, 4, 18), to: new Date(2022, 4, 29) }
  ];


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

  return (
    <div>
    
      

    <DayPicker
        disabled={disabledDays}
        mode="range"
        defaultMonth={new Date()}
        numberOfMonths={2}
        onSelect={setRange}
        selected={range}
        // modifiersClassNames={{
        //   selected: 'my-selected',
        //   today: 'my-today'
        // }}
        styles={{
          
          caption: { color: 'blue' },
          day: { color: 'red' },
          cell: { backgroundColor: 'blue' },
        }}
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
