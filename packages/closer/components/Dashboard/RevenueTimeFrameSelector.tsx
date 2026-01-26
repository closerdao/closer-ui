import { Dispatch, SetStateAction, useState } from 'react';

import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

const TIME_FRAMES = [
  { key: 'allTime', label: 'All time' },
  { key: 'currentYear', label: 'Year' },
  { key: 'currentMonth', label: 'Month' },
  { key: 'last7Days', label: 'Week' },
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
          onClick={() => {
            setTimeFrame('custom');
            setShowDropdown((prev) => !prev);
          }}
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
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="fixed inset-4 z-50 bg-white rounded-lg shadow-xl flex flex-col md:absolute md:inset-auto md:z-10 md:right-0 md:top-full md:mt-2 md:shadow-lg md:border md:border-gray-200">
              <div className="flex items-center justify-between p-4 border-b md:hidden">
                <span className="font-medium">{t('bookings_select_dates_button')}</span>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
                <DateTimePicker
                  setStartDate={(date) =>
                    handleDateChange(
                      date ? dayjs(date).format('YYYY-MM-DD') : '',
                      toDate,
                    )
                  }
                  setEndDate={(date) =>
                    handleDateChange(
                      fromDate,
                      date ? dayjs(date).format('YYYY-MM-DD') : '',
                    )
                  }
                  savedStartDate={fromDate}
                  savedEndDate={toDate}
                  defaultMonth={new Date()}
                  isDashboard={true}
                />
              </div>
              <div className="p-4 border-t flex gap-2">
                <Button
                  isEnabled={Boolean(toDate && fromDate)}
                  variant="secondary"
                  size="small"
                  onClick={handleClearDates}
                  className="flex-1"
                >
                  {t('booking_requests_clear_dates_button')}
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => setShowDropdown(false)}
                  className="flex-1 md:hidden"
                >
                  {t('generic_done')}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenueTimeFrameSelector;
