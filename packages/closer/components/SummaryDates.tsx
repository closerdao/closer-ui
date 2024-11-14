import Link from 'next/link';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useConfig } from '../hooks/useConfig';
import { Listing } from '../types';
import api from '../utils/api';
import {
  dateToPropertyTimeZone,
  getLocalTimeAvailability,
  getTimeOptions,
} from '../utils/booking.helpers';
import { formatDate } from '../utils/listings.helpers';
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
  priceDuration?: string;
  workingHoursStart?: number | undefined;
  workingHoursEnd?: number | undefined;
  listingId?: string | undefined;
  numSpacesRequired?: number;
  isVolunteerOrResidency?: boolean;
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
  eventName,
  volunteerName,
  ticketOption,
  doesNeedPickup,
  doesNeedSeparateBeds,
  isEditMode,
  setters,
  updatedListingId,
  listings,
  priceDuration,
  workingHoursStart,
  workingHoursEnd,
  listingId,
  numSpacesRequired,
  isVolunteerOrResidency,
}: SummaryDatesProps) => {
  const t = useTranslations();

  const { TIME_ZONE } = useConfig() || {};

  const isHourlyBooking = priceDuration === 'hour';

  const timeOptions = getTimeOptions(
    workingHoursStart,
    workingHoursEnd,
    TIME_ZONE,
  );

  let listingOptions: { value: string; label: string }[] | null =
    listings?.map((listing) => ({ value: listing._id, label: listing.name })) ||
    null;

  if (priceDuration === 'hour') {
    listingOptions =
      listings
        ?.filter((listing) => listing.priceDuration === 'hour')
        .map((listing) => ({ value: listing._id, label: listing.name })) ||
      null;
  }

  const durationInDays = dayjs(endDate)
    .startOf('day')
    .diff(dayjs(startDate).startOf('day'), 'day');

  const [hourAvailability, setHourAvailability] = useState<
    { hour: string; isAvailable: boolean }[] | []
  >([]);

  const getAvailability = async (
    startDate: Date | string | null,
    endDate: Date | string | null,
    listingId?: string | null,
  ) => {
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/listing/availability', {
        start: isHourlyBooking ? startDate : formatDate(startDate),
        end: isHourlyBooking ? endDate : formatDate(endDate),
        listing: listingId,
        adults: totalGuests,
        children: kids,
        infants,
        pets,
        useTokens: false,
      });

      return { results, availability };
    } catch (error) {
      console.log('Error', error);
      return { results: null, availability: null };
    }
  };

  useEffect(() => {
    if (!isEditMode || !listingId) return;
    (async function updatePrices() {
      const { availability } = await getAvailability(
        startDate,
        endDate,
        listingId,
      );

      setHourAvailability(getLocalTimeAvailability(availability, TIME_ZONE));
    })();
  }, [startDate, endDate]);

  return (
    <div>
      {eventName ? (
        <HeadingRow>
          <span className="mr-4">🏡</span>
          <span>{t('bookings_summary_step_your_event')}</span>
        </HeadingRow>
      ) : (
        <HeadingRow>
          <span className="mr-4">🏡</span>
          <span>
            {isHourlyBooking
              ? t('bookings_summary_step_dates_title_hourly')
              : t('bookings_dates_step_guests_title')}
          </span>
        </HeadingRow>
      )}
      {eventName && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{t('bookings_summary_step_dates_event')}</p>
          <p className="font-bold text-right">{eventName}</p>
        </div>
      )}
      {volunteerName && (
        <div className="flex justify-between mt-3 gap-20 items-start	">
          <p>{t('bookings_summary_step_volunteer_opportunity')}</p>
          <p className="font-bold text-right">{volunteerName}</p>
        </div>
      )}
      {ticketOption && (
        <div className="flex justify-between items-start mt-3">
          <p>{t('bookings_summary_step_dates_ticket_option')}</p>
          <p className="font-bold uppercase">
            {ticketOption} X {totalGuests}
          </p>
        </div>
      )}

      {!isHourlyBooking && (
        <>
          <div className="flex justify-between items-center my-3">
            <p>{t('bookings_summary_step_dates_number_of_guests')}</p>
            <div className="font-bold">
              {isEditMode ? (
                <div className="bg-accent-light p-2 w-[115px] flex justify-end rounded-md">
                  <Counter
                    value={totalGuests}
                    setFn={setters?.setUpdatedAdults}
                    minValue={1}
                  />
                </div>
              ) : (
                totalGuests
              )}
            </div>
          </div>
          <div className="flex justify-between items-center my-3">
            <p>{t('bookings_dates_step_guests_children')}</p>
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
            <p>{t('bookings_dates_step_guests_infants')}</p>
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
            <p>{t('bookings_dates_step_guests_pets')}</p>
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
        </>
      )}

      <div className="flex justify-between items-start my-3">
        <p>
          {' '}
          {isDayTicket ? t('listings_book_day') : t('listings_book_check_in')}
        </p>
        <p className="font-bold">
          {startDate &&
            TIME_ZONE &&
            isHourlyBooking &&
            !isEditMode &&
            dateToPropertyTimeZone(TIME_ZONE, startDate)}
          {startDate && !isHourlyBooking
            ? dayjs(startDate).format('DD / MM / YY')
            : null}

          {startDate && TIME_ZONE && isHourlyBooking && isEditMode && startDate}
        </p>
      </div>
      {!isDayTicket && (
        <>
          <div className="flex justify-between items-start my-3">
            <p> {t('listings_book_check_out')}</p>
            <p className="font-bold">
              {endDate &&
                TIME_ZONE &&
                isHourlyBooking &&
                !isEditMode &&
                dateToPropertyTimeZone(TIME_ZONE, endDate)}

              {startDate && !isHourlyBooking
                ? dayjs(endDate).format('DD / MM / YY')
                : null}

              {endDate && TIME_ZONE && isHourlyBooking && isEditMode && endDate}
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
                  priceDuration={priceDuration || 'night'}
                  timeOptions={timeOptions}
                  hourAvailability={hourAvailability}
                />
              </div>
            )}
          </div>

          {!isHourlyBooking && (
            <div className="flex justify-between items-start my-3">
              <p> {t('bookings_stay_duration')}</p>
              <p className="font-bold">{durationInDays || '-'}</p>
            </div>
          )}
        </>
      )}

      {listingName && (
        <div className="flex justify-between items-center mt-3">
          <p>{t('bookings_summary_step_dates_accomodation_type')}</p>

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
                placeholder={t('manage_users_add_role_button')}
              />
            </div>
          ) : (
            <Link
              href={`/stay/${listingUrl}`}
              className="font-bold uppercase text-right text-accent"
            >
              {listingName} {numSpacesRequired && 'x' + ' ' + numSpacesRequired}
            </Link>
          )}
        </div>
      )}

      {!isHourlyBooking && (
        <div>
          {isVolunteerOrResidency && (
            <div className="flex justify-between items-start mt-3">
              <p>{t('bookings_summary_step_dates_commitment')}</p>
              <p className="font-bold uppercase">
                {t('bookings_summary_step_dates_default_commitment')}
              </p>
            </div>
          )}
          {doesNeedPickup !== undefined && (
            <div className="flex justify-between mt-3 gap-20 items-start	">
              <p>{t('bookings_pickup')}</p>
              <p className="font-bold uppercase text-right">
                {doesNeedPickup ? t('generic_yes') : t('generic_no')}
              </p>
            </div>
          )}
          {doesNeedSeparateBeds !== undefined && (
            <div className="flex justify-between mt-3 gap-20 items-start	">
              <p>{t('booking_card_separate_beds_needed')}</p>
              <p className="font-bold uppercase text-right">
                {doesNeedSeparateBeds ? t('generic_yes') : t('generic_no')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SummaryDates;
