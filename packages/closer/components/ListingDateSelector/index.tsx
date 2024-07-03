import { Dispatch, SetStateAction, useState } from 'react';

import dayjs from 'dayjs';

import { useOutsideClick } from '../../hooks/useOutsideClick';
import { getTimeOnly } from '../../utils/booking.helpers';
import { __ } from '../../utils/helpers';
import DateTimePicker from '../DateTimePicker';
import { Button } from '../ui';

interface Props {
  setStartDate: Dispatch<SetStateAction<string | Date | null>> | undefined;
  setEndDate: Dispatch<SetStateAction<string | Date | null>> | undefined;
  end: string | Date | null;
  start: string | Date | null;
  isSmallScreen?: boolean;
  blockedDateRanges?: any[];
  isEditMode?: boolean;
  priceDuration?: string;
  timeOptions?: string[] | null;
  hourAvailability?: { hour: string; isAvailable: boolean }[] | [];
}

const ListingDateSelector = ({
  setStartDate,
  setEndDate,
  end,
  start,
  isSmallScreen,
  blockedDateRanges,
  isEditMode,
  priceDuration,
  timeOptions,
  hourAvailability,
}: Props) => {
  const stayDatesDropdownRef = useOutsideClick(handleClickOutsideDropdown);
  const isHourlyBooking = priceDuration === 'hour';
  const isStartTimeSet = timeOptions?.includes(String(getTimeOnly(start)));
  const isEndTimeSet = timeOptions?.includes(String(getTimeOnly(end)));

  const [showStayDatesDropdown, setShowStayDatesDropdown] = useState(false);

  const getDefaultMonth = () => {
    if (!start) {
      return new Date();
    }
    return isEditMode ? new Date(start) : new Date();
  };

  function handleClickOutsideDropdown() {
    setShowStayDatesDropdown(false);
  }

  return (
    <>
      <div ref={stayDatesDropdownRef} className="static sm:relative flex-1">
        <label className="my-2 hidden sm:block">
          {isHourlyBooking && __('bookings_select_date_and_time')}

          {!isHourlyBooking &&
            (isEditMode ? (
              <strong>{__('bookings_edit_stay_dates')}</strong>
            ) : (
              __('bookings_select_stay_dates')
            ))}
        </label>
        <Button
          dataTestid="select-dates-button"
          onClick={() => setShowStayDatesDropdown(!showStayDatesDropdown)}
          className={`${
            isEditMode
              ? 'py-2 px-5 w-full border-2'
              : 'py-1 px-0 w-auto border-0'
          } min-h-[20px] font-bold sm:font-normal underline sm:no-underline text-black  sm:border-2 border-black normal-case  sm:w-full  sm:px-3 sm:p-3 sm:py-2 text-sm bg-white`}
        >
          {isHourlyBooking &&
            !isStartTimeSet &&
            !isEndTimeSet &&
            !start &&
            'Select date'}

          {isHourlyBooking && start && (
            <>
              {isSmallScreen
                ? dayjs(start).format('MMM DD')
                : dayjs(start).format('DD/MM/YY')}{' '}
            </>
          )}

          {isHourlyBooking &&
            isStartTimeSet &&
            !isEndTimeSet &&
            `- ${getTimeOnly(start)} -`}
          {isHourlyBooking &&
            isStartTimeSet &&
            isEndTimeSet &&
            `- ${getTimeOnly(start)} - ${getTimeOnly(end)}`}

          {!isHourlyBooking && (
            <>
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
            </>
          )}
        </Button>
        {showStayDatesDropdown && (
          <div
            className={`${
              isEditMode ? '' : 'bottom-[175px]'
            } border border-gray-100 sm:w-auto absolute z-10 left-2 right-2 sm:left-auto  sm:bottom-auto sm:top-auto bg-white shadow-md rounded-md p-3`}
          >

            <DateTimePicker
              setStartDate={setStartDate as any}
              setEndDate={setEndDate as any}
              savedStartDate={start}
              savedEndDate={end}
              defaultMonth={getDefaultMonth()}
              blockedDateRanges={blockedDateRanges}
              priceDuration={priceDuration}
              timeOptions={timeOptions}
              hourAvailability={hourAvailability}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ListingDateSelector;
