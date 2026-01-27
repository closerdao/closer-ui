import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { ChevronDown, Download, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { formatDate } from '../../utils/listings.helpers';
import Counter from '../Counter';
import ListingDateSelector from '../ListingDateSelector';
import Modal from '../Modal';
import { Button, Information, Input, Spinner } from '../ui';
import Select from '../ui/Select/Dropdown';

interface ListingOption {
  value: string;
  label: string;
}

interface BookingActionsDropdownProps {
  listingOptions?: ListingOption[];
  onExportCsv?: () => void;
  showExportCsv?: boolean;
  showCreateBooking?: boolean;
}

const BookingActionsDropdown = ({
  listingOptions = [],
  onExportCsv,
  showExportCsv = false,
  showCreateBooking = true,
}: BookingActionsDropdownProps) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const openCreateBookingModal = () => {
    setIsOpen(false);
    setIsModalOpen(true);
    setHasCreatedBooking(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    setIsOpen(false);
    onExportCsv?.();
  };

  const hasActions = showCreateBooking || showExportCsv;

  if (!hasActions) return null;

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
        >
          {t('generic_actions')}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[200px]">
            {showCreateBooking && listingOptions.length > 0 && (
              <button
                onClick={openCreateBookingModal}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Plus className="w-4 h-4" />
                {t('booking_calendar_spacehost_booking')}
              </button>
            )}
            {showExportCsv && onExportCsv && (
              <button
                onClick={handleExportCsv}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                <Download className="w-4 h-4" />
                {t('generic_export_csv')}
              </button>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal closeModal={closeModal}>
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">{t('booking_calendar_spacehost_booking')}</h2>
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
              className="rounded-full border-black"
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
    </>
  );
};

export default BookingActionsDropdown;
