import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

const TIME_FRAMES = [
  { key: 'allTime', label: 'All time' },
  { key: 'year', label: 'Year' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'today', label: 'Today' },
];

interface Props {
  setTimeFrame: Dispatch<SetStateAction<string>>;
  timeFrame: string;
  fromDate: string;
  toDate: string;
  setFromDate: Dispatch<SetStateAction<string>>;
  setToDate: Dispatch<SetStateAction<string>>;
}

const TimeFrameSelector = ({
  timeFrame,
  setTimeFrame,
  toDate,
  fromDate,
  setFromDate,
  setToDate,
}: Props) => {
  const t = useTranslations();
  const dateRangeDropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dateRangeDropdownRef.current &&
        !dateRangeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (fromDate && toDate && timeFrame !== 'custom') {
      setTimeFrame('custom');
    }
  }, [fromDate, toDate, timeFrame]);

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  const handleTimeFrameClick = (frame: string) => {
    if (frame === timeFrame) return;
    setToDate('');
    setFromDate('');
    setTimeFrame(frame);
  };

  const isCustomActive = timeFrame === 'custom' || (fromDate && toDate);

  return (
    <div className="flex flex-wrap gap-2">
      {TIME_FRAMES.map((frame) => (
        <button
          key={frame.key}
          onClick={() => handleTimeFrameClick(frame.key)}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
            timeFrame === frame.key
              ? 'bg-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {frame.label}
        </button>
      ))}

      <div ref={dateRangeDropdownRef} className="relative">
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
            isCustomActive
              ? 'bg-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {fromDate && toDate
            ? `${dayjs(fromDate).format('DD/MM')} - ${dayjs(toDate).format('DD/MM')}`
            : t('bookings_select_dates_button')}
        </button>
        {showDropdown && (
          <div className="absolute z-10 right-0 top-full mt-2 bg-white shadow-lg rounded-lg p-4 border border-gray-200">
            <DateTimePicker
              setStartDate={setFromDate as any}
              setEndDate={setToDate as any}
              savedStartDate={fromDate}
              savedEndDate={toDate}
              defaultMonth={new Date()}
              isDashboard={true}
            />
            <Button
              isEnabled={Boolean(toDate && fromDate)}
              variant="secondary"
              size="small"
              onClick={handleClearDates}
            >
              {t('booking_requests_clear_dates_button')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeFrameSelector;
