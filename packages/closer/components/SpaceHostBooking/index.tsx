import { ChangeEvent, useEffect, useState } from 'react';

import { Button, Information, Input, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { formatDate } from '../../utils/listings.helpers';
import Counter from '../Counter';
import ListingDateSelector from '../ListingDateSelector';
import Modal from '../Modal';
import Select from '../ui/Select/Dropdown';

interface Props {
  listingOptions: {
    value: string;
    label: string;
  }[];
}

const SpaceHostBooking = ({ listingOptions }: Props) => {
  const t = useTranslations();
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);
  const [start, setStartDate] = useState<string | null | Date>(null);
  const [end, setEndDate] = useState<string | null | Date>(null);
  const [adults, setAdults] = useState<number>(1);
  const [listingId, setListingId] = useState('');
  const [isListingAvailable, setIsListingAvailable] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [adminBookingReason, setAdminBookingReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCreatedBooking, setHasCreatedBooking] = useState(false);

  useEffect(() => {
    setCalendarError(null);

    const isCalendarSelectionValid =
      end && formatDate(start) !== formatDate(end) && listingId;
    if (!end) {
      setCalendarError(t('bookings_incomplete_dates_error'));
    }
    if (formatDate(start) === formatDate(end)) {
      setCalendarError(t('bookings_date_range_error'));
    }
    if (isCalendarSelectionValid) {
      (async function updatePrices() {
        const { results } = await getAvailability(start, end, listingId);

        setIsListingAvailable(Boolean(results));
      })();
    }
  }, [adults, start, end, listingId]);

  const getAvailability = async (
    startDate: Date | string | null,
    endDate: Date | string | null,
    listingId?: string | null,
  ) => {
    try {
      const {
        data: { results, availability },
      } = await api.post('/bookings/listing/availability', {
        start: formatDate(startDate),
        end: formatDate(endDate),
        listing: listingId,
        adults,
      });

      return { results, availability };
    } catch (error) {
      console.error('error=', error);
      return { results: null, availability: null };
    }
  };

  const bookListing = async () => {
    try {
      setIsLoading(true);
      setHasCreatedBooking(false);
      await api.post('/bookings/admin', {
        start: formatDate(start),
        end: formatDate(end),
        adults,
        listingId,
        adminBookingReason,
      });
      setHasCreatedBooking(true);
    } catch (error) {
      console.error('error=', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsInfoModalOpened(true);
    setHasCreatedBooking(false);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  return (
    <div>
      <div>
        <Button className="max-w-[320px]" onClick={openModal}>
          {t('booking_calendar_spacehost_booking')}
        </Button>
        {isInfoModalOpened && (
          <Modal closeModal={closeModal}>
            <div className="flex flex-col gap-5">
              <ListingDateSelector
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                end={end}
                start={start}
                blockedDateRanges={[]}
              />
              <div className="flex space-between items-center">
                <p className="flex-1">
                  {t('bookings_dates_step_guests_adults')}
                </p>
                <Counter value={adults} setFn={setAdults} minValue={1} />
              </div>
              <Select
                className="rounded-full  border-black"
                value={listingId}
                options={listingOptions}
                onChange={(value: string) => setListingId(value)}
                isRequired
                placeholder={t('listing_select')}
              />

              <div className="flex-1 min-w-[160px]">
                <Input
                  value={adminBookingReason}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setAdminBookingReason(e.target.value)
                  }
                  type="text"
                  placeholder={t('booking_calendar_spacehost_booking_reason')}
                  className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
                />
              </div>

              <Button
                onClick={bookListing}
                isEnabled={Boolean(
                  start &&
                    end &&
                    isListingAvailable &&
                    !calendarError &&
                    !isLoading,
                )}
                className="flex gap-2 text-lg btn-primary text-center h-[32px] sm:h-auto sm:mt-4"
              >
                {isLoading && <Spinner />}
                {t('listings_slug_link')}
              </Button>
              {hasCreatedBooking && (
                <Information>
                  {t('booking_calendar_spacehost_booking_created')}
                </Information>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default SpaceHostBooking;
