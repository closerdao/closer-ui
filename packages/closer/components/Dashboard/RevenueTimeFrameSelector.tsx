import { Dispatch, SetStateAction, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

const TIME_FRAMES = [
  'currentMonth',
  'previousMonth',
  'last7Days',
  'last4Weeks',
  'currentYear',
  'allTime',
];

interface Props {
  setTimeFrame: Dispatch<SetStateAction<string>>;
  timeFrame: string;
  fromDate: string;
  toDate: string;
  setFromDate: Dispatch<SetStateAction<string>>;
  setToDate: Dispatch<SetStateAction<string>>;
}

const RevenueTimeFrameSelector = ({
  timeFrame,
  setTimeFrame,
  toDate,
  fromDate,
  setFromDate,
  setToDate,
}: Props) => {
  const t = useTranslations();
  const dateRangeDropdownRef = useOutsideClick(handleClickOutsideDropdown);

  const [showDropdown, setShowDropdown] = useState(false);

  function handleClickOutsideDropdown() {
    setShowDropdown(false);
  }

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  const handleDateChange = (startDate: string, endDate: string) => {
    setFromDate(startDate);
    setToDate(endDate);
    if (startDate && endDate) {
      setTimeFrame('custom');
    }
  };

  const handleTimeFrameClick = (frame: string) => {
    if (frame === timeFrame) return;
    setToDate('');
    setFromDate('');
    setTimeFrame(frame);
  };

  const getTimeFrameLabel = (frame: string) => {
    switch (frame) {
      case 'currentMonth':
        return 'Current Month';
      case 'previousMonth':
        return 'Previous Month';
      case 'last7Days':
        return 'Last 7 Days';
      case 'last4Weeks':
        return 'Last 4 Weeks';
      case 'currentYear':
        return 'Current Year';
      case 'allTime':
        return 'All Time';
      case 'custom':
        return 'Custom Range';
      default:
        return frame;
    }
  };

  return (
    <div>
      <div className="flex gap-x-1 gap-y-4 flex-wrap sm:flex-nowrap">
        {TIME_FRAMES.map((frame) => (
          <button
            key={frame}
            onClick={() => handleTimeFrameClick(frame)}
            className={`${
              timeFrame === frame
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } rounded-full px-3 py-1 text-sm transition-colors`}
          >
            {getTimeFrameLabel(frame)}
          </button>
        ))}

        <div
          ref={dateRangeDropdownRef}
          className="relative flex-1 min-w-[170px] ml-2"
        >
          <Button
            onClick={() => {
              setTimeFrame('custom');
              setShowDropdown((prev) => !prev);
            }}
            className={`${
              timeFrame === 'custom' || (fromDate && toDate)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-black border-black'
            } normal-case text-md py-1 text-sm`}
            size="small"
            variant="secondary"
          >
            {!fromDate && !toDate && t('bookings_select_dates_button')}
            {fromDate && <>{dayjs(fromDate).format('DD/MM/YY')} - </>}
            {toDate && dayjs(toDate).format('DD/MM/YY')}
          </Button>
          {showDropdown && (
            <div className="absolute z-10 right-0 bg-white shadow-md rounded-md p-4">
              <DateTimePicker
                setStartDate={(date) => handleDateChange(date, toDate)}
                setEndDate={(date) => handleDateChange(fromDate, date)}
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
    </div>
  );
};

export default RevenueTimeFrameSelector;
