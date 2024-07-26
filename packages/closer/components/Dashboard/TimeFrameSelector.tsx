import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

const timeFrames = ['year', 'month', 'week', 'today'];

interface Props {
  setTimeFrame: Dispatch<SetStateAction<string>>;
  timeFrame: string;
  fromDate: string;
  toDate: string;
  setFromDate: Dispatch<SetStateAction<string>>;
  setToDate: Dispatch<SetStateAction<string>>;
}

const TimeFrameSelector = ({ timeFrame, setTimeFrame, toDate, fromDate, setFromDate, setToDate }: Props) => {
  const t = useTranslations();
  const dateRangeDropdownRef = useOutsideClick(handleClickOutsideDropdown);

  const [showDropdown, setShowDropdown] = useState(false);



  useEffect(() => {
    if (fromDate && toDate) {
      setTimeFrame('custom');
    }
  }, [fromDate, toDate]);

  function handleClickOutsideDropdown() {
    setShowDropdown(false);
  }

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <div>
      <div className="flex gap-x-1 gap-y-4 flex-wrap sm:flex-nowrap">
        {timeFrames.map((frame) => (
          <button
            key={frame}
            onClick={() => {
              setToDate('');
              setFromDate('');
              setTimeFrame(frame);
            }}
            className={`${
              timeFrame === frame
                ? 'bg-accent text-white'
                : 'bg-neutral text-black'
            } rounded-full  px-3 py-1 text-sm`}
          >
            {t(`dashboard_${frame}`)}
          </button>
        ))}

        <div
          ref={dateRangeDropdownRef}
          className="relative flex-1 min-w-[170px] ml-2"
        >
          <Button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="text-black border-black normal-case text-md py-1 text-sm"
            size="small"
            type="secondary"
          >
            {!fromDate && !toDate && t('bookings_select_dates_button')}
            {fromDate && <>{dayjs(fromDate).format('DD/MM/YY')} - </>}
            {toDate && dayjs(toDate).format('DD/MM/YY')}
          </Button>
          {showDropdown && (
            <div className="absolute z-10 right-0 bg-white shadow-md rounded-md p-4">
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
                type="secondary"
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

export default TimeFrameSelector;
