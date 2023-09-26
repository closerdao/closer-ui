import React, { Dispatch, SetStateAction, useState } from 'react';

import dayjs from 'dayjs';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import { __ } from '../../utils/helpers';
import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

interface Props {
  setStartDate: Dispatch<SetStateAction<string | Date | null>>;
  setEndDate: Dispatch<SetStateAction<string | Date | null>>;
  end: string | Date | null;
  start: string | Date | null;
  isSmallScreen?: boolean;
  blockedDateRanges?: any[]
}

const ListingDateSelector = ({
  setStartDate,
  setEndDate,
  end,
  start,
  isSmallScreen,
  blockedDateRanges
}: Props) => {
  const stayDatesDropdownRef = useOutsideClick(handleClickOutsideDropdown);

  const [showStayDatesDropdown, setShowStayDatesDropdown] = useState(false);

  function handleClickOutsideDropdown() {
    setShowStayDatesDropdown(false);
  }

  return (
    <>
      <div
        ref={stayDatesDropdownRef}
        className="static sm:relative flex-1"
      >
        <label className="my-2 hidden sm:block">{__('bookings_select_stay_dates')}</label>
        <Button
          onClick={() => setShowStayDatesDropdown(!showStayDatesDropdown)}
          className="min-h-[20px] font-bold sm:font-normal underline sm:no-underline text-black border-0 sm:border-2 border-black normal-case w-auto sm:w-full py-1 px-0 sm:px-3 sm:p-3 sm:py-2 text-sm bg-white"
        >
          {!start && !end && __('bookings_select_dates_button')}
          {start && (
            <>
              {isSmallScreen
                ? dayjs(start).format('MMM DD')
                : dayjs(start).format('DD/MM/YY')}{' '}
              -
            </>
          )}
          {end && (
            <>
              {' '}
              {isSmallScreen
                ? dayjs(end).format('MMM DD')
                : dayjs(end).format('DD/MM/YY')}
            </>
          )}
        </Button>
        {showStayDatesDropdown && (
          <div className="border border-gray-100 w-full sm:w-auto absolute z-10 right-auto left-0 sm:left-auto sm:right-0 bottom-[125px] sm:bottom-auto sm:top-auto bg-white shadow-md rounded-md p-4">
            <DateTimePicker
              setStartDate={setStartDate as any}
              setEndDate={setEndDate as any}
              savedStartDate={start}
              savedEndDate={end}
              defaultMonth={new Date()}
              blockedDateRanges={blockedDateRanges}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ListingDateSelector;
