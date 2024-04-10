import Link from 'next/link';

import { Dispatch, SetStateAction } from 'react';

import dayjs from 'dayjs';

import { Listing } from '../types';
import { __ } from '../utils/helpers';
import Counter from './Counter';
import ListingDateSelector from './ListingDateSelector';
import HeadingRow from './ui/HeadingRow';
import Select from './ui/Select/Dropdown';

interface SummaryDatesProps {
  isDayTicket: boolean;
  totalGuests: number;
  kids?: number;
  pets?: number;
  infants?: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  listingName: string;
  listingUrl: string;
  eventName?: string;
  volunteerName?: string;
  ticketOption?: string;
  volunteerId?: string;
  doesNeedPickup?: boolean;
  doesNeedSeparateBeds?: boolean;
  isEditMode?: boolean;
  setters?: {
    setUpdatedAdults?: Dispatch<SetStateAction<number>>;
    setUpdatedChildren?: Dispatch<SetStateAction<number>>;
    setUpdatedInfants?: Dispatch<SetStateAction<number>>;
    setUpdatedPets?: Dispatch<SetStateAction<number>>;
    setUpdatedStartDate?: Dispatch<SetStateAction<string | Date | null>>;
    setUpdatedEndDate?: Dispatch<SetStateAction<string | Date | null>>;
    setUpdatedListingId?: Dispatch<SetStateAction<string>>;
  };

  updatedListingId?: string;
  listings?: Listing[];
  updatedMaxBeds?: number;
}

const SummaryDates = ({
  isDayTicket,
  totalGuests,
  kids,
  pets,
  infants,
  startDate,
  endDate,
  listingName,
  listingUrl,
  volunteerId,
  eventName,
  volunteerName,
  ticketOption,
  doesNeedPickup,
  doesNeedSeparateBeds,
  isEditMode,
  setters,
  updatedListingId,
  listings,
  updatedMaxBeds,
}: SummaryDatesProps) => {
  const listingOptions = listings?.map((listing) => ({
    value: listing._id,
    label: listing.name,
  }));
  return (
    <div>
      {eventName ? (
        <HeadingRow>
          <span className="mr-4">🏡</span>
          <span>{__('bookings_summary_step_your_event')}</span>
        </HeadingRow>
      ) : (
        <HeadingRow>
          <span className="mr-4">🏡</span>
          <span>{__('bookings_summary_step_dates_title')}</span>
        </HeadingRow>
      )}
      {eventName && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{__('bookings_summary_step_dates_event')}</p>
          <p className="font-bold text-right">{eventName}</p>
        </div>
      )}
      {volunteerName && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{__('bookings_summary_step_volunteer_opportunity')}</p>
          <p className="font-bold text-right">{volunteerName}</p>
        </div>
      )}
      {ticketOption && (
        <div className="flex justify-between items-start mt-3">
          <p>{__('bookings_summary_step_dates_ticket_option')}</p>
          <p className="font-bold uppercase">
            {ticketOption} X {totalGuests}
          </p>
        </div>
      )}
      <div className="flex justify-between items-center my-3">
        <p>{__('bookings_summary_step_dates_number_of_guests')}</p>
        <div className="font-bold">
          {isEditMode ? (
            <div className="bg-accent-light p-2 w-[115px] flex justify-end rounded-md">
              <Counter
                value={totalGuests}
                setFn={setters?.setUpdatedAdults}
                minValue={1}
                maxValue={updatedMaxBeds}
              />
            </div>
          ) : (
            totalGuests
          )}
        </div>
      </div>
      <div className="flex justify-between items-center my-3">
        <p>{__('bookings_dates_step_guests_children')}</p>
        <div className="font-bold">
          {isEditMode ? (
            <div className="bg-accent-light p-2 w-[115px] flex justify-end rounded-md">
              <Counter
                value={kids}
                setFn={setters?.setUpdatedChildren}
                minValue={0}
              />
            </div>
          ) : (
            kids
          )}
        </div>
      </div>
      <div className="flex justify-between items-center my-3">
        <p>{__('bookings_dates_step_guests_infants')}</p>
        <div className="font-bold">
          {isEditMode ? (
            <div className="bg-accent-light p-2 w-[115px] flex justify-end rounded-md">
              <Counter
                value={infants}
                setFn={setters?.setUpdatedInfants}
                minValue={0}
              />
            </div>
          ) : (
            infants
          )}
        </div>
      </div>
      <div className="flex justify-between items-center my-3 ">
        <p>{__('bookings_dates_step_guests_pets')}</p>
        <div className="font-bold">
          {isEditMode ? (
            <div className="bg-accent-light p-2 w-[115px] flex justify-end rounded-md">
              <Counter
                value={pets}
                setFn={setters?.setUpdatedPets}
                minValue={0}
              />
            </div>
          ) : (
            pets
          )}
        </div>
      </div>
      <div className="flex justify-between items-start my-3">
        <p>
          {' '}
          {isDayTicket ? __('listings_book_day') : __('listings_book_check_in')}
        </p>
        <p className="font-bold">
          {startDate
            ? dayjs(startDate).format('DD / MM / YY')
            : __('bookings_dates_enter_date')}
        </p>
      </div>
      {!isDayTicket && (
        <>
          <div className="flex justify-between items-start my-3">
            <p> {__('listings_book_check_out')}</p>
            <p className="font-bold">
              {endDate
                ? dayjs(endDate).format('DD / MM / YY')
                : __('bookings_dates_enter_date')}
            </p>
          </div>
          <div>
            {isEditMode && (
              <div className="flex justify-between items-start my-3 rounded-md bg-accent-light p-4">
                <ListingDateSelector
                  setStartDate={setters?.setUpdatedStartDate}
                  setEndDate={setters?.setUpdatedEndDate}
                  end={endDate}
                  start={startDate}
                  isSmallScreen={false}
                  blockedDateRanges={[]}
                  isEditMode={true}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-start my-3">
            <p> {__('bookings_stay_duration')}</p>
            <p className="font-bold">
              {dayjs(endDate)
                .startOf('day')
                .diff(dayjs(startDate).startOf('day'), 'day') || '-'}
            </p>
          </div>
        </>
      )}

      {listingName && (
        <div className="flex justify-between items-center mt-3">
          <p>{__('bookings_summary_step_dates_accomodation_type')}</p>

          {isEditMode && setters?.setUpdatedListingId && listingOptions ? (
            <div className="bg-accent-light rounded-md p-2">
              <Select
                className="rounded-full  border-black"
                value={updatedListingId}
                options={listingOptions}
                onChange={(value: string) =>
                  setters?.setUpdatedListingId &&
                  setters.setUpdatedListingId(value)
                }
                isRequired
                placeholder={__('manage_users_add_role_button')}
              />
            </div>
          ) : (
            <Link
              href={`/stay/${listingUrl}`}
              className="font-bold uppercase text-right text-accent"
            >
              {listingName}
            </Link>
          )}
        </div>
      )}

      {volunteerId && (
        <div className="flex justify-between items-start mt-3">
          <p>{__('bookings_summary_step_dates_commitment')}</p>
          <p className="font-bold uppercase">
            {__('bookings_summary_step_dates_default_commitment')}
          </p>
        </div>
      )}
      {doesNeedPickup !== undefined && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{__('bookings_pickup')}</p>
          <p className="font-bold uppercase text-right">
            {doesNeedPickup ? __('generic_yes') : __('generic_no')}
          </p>
        </div>
      )}
      {doesNeedSeparateBeds !== undefined && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{__('booking_card_separate_beds_needed')}</p>
          <p className="font-bold uppercase text-right">
            {doesNeedSeparateBeds ? __('generic_yes') : __('generic_no')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryDates;
