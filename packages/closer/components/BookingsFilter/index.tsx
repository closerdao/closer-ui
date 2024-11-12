import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import DateTimePicker from '../../components/DateTimePicker';
import { Button, ErrorMessage, Input } from '../../components/ui';
import Select from '../../components/ui/Select/Dropdown';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
  BOOKINGS_PER_PAGE,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE_OPTIONS,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useOutsideClick } from '../../hooks/useOutsideClick';

const loadTime = new Date();

interface Props {
  setFilter: Dispatch<SetStateAction<any>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  defaultWhere: any;
}

const BookingsFilter = ({ setFilter, page, setPage, defaultWhere }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const arrivalDropdownRef = useOutsideClick(handleClickOutsideArrivalDropdown);
  const departureDropdownRef = useOutsideClick(
    handleClickOutsideDepartureDropdown,
  );
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);

  const [bookingType, setBookingType] = useState('any');
  const [bookingStatus, setBookingStatus] = useState('any');
  const [bookingId, setBookingId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState({
    label: 'any',
    value: 'any',
  });

  const [arrivalFromDate, setArrivalFromDate] = useState<string | undefined>(
    '',
  );
  const [arrivalToDate, setArrivalToDate] = useState<string | undefined>('');
  const [departureToDate, setDepartureToDate] = useState<string | undefined>(
    '',
  );
  const [departureFromDate, setDepartureFromDate] = useState<
    string | undefined
  >('');

  const [filterValues, setFilterValues] = useState({
    type: 'any',
    status: 'any',
    bookingId: '',
    selectedEvent: { label: 'any', value: '' },
    arrivalFromDate: '',
    arrivalToDate: '',
    departureFromDate: '',
    departureToDate: '',
    sortBy: 'start',
  });
  const eventsFilter = {
    where: {
      end: { $gt: loadTime },
    },
  };

  const events = platform?.event?.find(eventsFilter);

  const [error, setError] = useState(false);

  const eventsData =
    events &&
    events
      .map((event: any) => {
        return { label: event.toJSON().name, value: event.toJSON()._id };
      })
      .toJSON();

  function handleClickOutsideArrivalDropdown() {
    setShowArrivalDropdown(false);
  }
  function handleClickOutsideDepartureDropdown() {
    setShowDepartureDropdown(false);
  }

  const loadData = async () => {
    try {
      await platform.event.get(eventsFilter);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  useEffect(() => {
    setPage(1);
  }, [filterValues]);

  useEffect(() => {
    const arrivalFrom = new Date(filterValues.arrivalFromDate);
    arrivalFrom.setDate(arrivalFrom.getDate() - 1);

    const departureFrom = new Date(filterValues.departureFromDate);
    departureFrom.setDate(departureFrom.getDate() - 1);

    const isDefaultFilter =
      !filterValues.departureToDate &&
      !filterValues.departureFromDate &&
      filterValues.status === 'any';

    const getFilter = {
      where: {
        ...(filterValues.type === 'event' && { eventId: { $exists: true } }),
        ...(filterValues.type === 'volunteer' && {
          volunteerId: { $exists: true },
        }),
        ...(filterValues.type === 'stay' && {
          volunteerId: { $exists: false },
          eventId: { $exists: false },
        }),
        ...(filterValues.status !== 'any'
          ? { status: [bookingStatus] }
          : { status: { $ne: 'open' } }),
        ...(filterValues.bookingId !== '' && { _id: filterValues.bookingId }),
        ...(filterValues.selectedEvent.label !== 'any' && {
          eventId: filterValues.selectedEvent.value,
        }),

        ...(filterValues.arrivalToDate &&
          filterValues.arrivalFromDate && {
            start: {
              $lte: new Date(filterValues.arrivalToDate),
              $gte: arrivalFrom,
            },
          }),
        ...(filterValues.departureToDate &&
          filterValues.departureFromDate && {
            end: {
              $lte: new Date(filterValues.departureToDate),
              $gte: departureFrom,
            },
          }),
        ...(isDefaultFilter && defaultWhere),
      },
      limit: BOOKINGS_PER_PAGE,
      sort_by: filterValues.sortBy,
      page: page,
    };

    setFilter(getFilter as any);
  }, [filterValues, page]);

  useEffect(() => {
    if (arrivalFromDate && arrivalToDate) {
      setFilterValues({
        ...filterValues,
        arrivalFromDate: arrivalFromDate as string,
        arrivalToDate: arrivalToDate as string,
      });
    }
    if (!arrivalFromDate && !arrivalToDate) {
      setFilterValues({
        ...filterValues,
        arrivalFromDate: '',
        arrivalToDate: '',
      });
    }
  }, [arrivalFromDate, arrivalToDate]);

  useEffect(() => {
    if (departureFromDate && departureToDate) {
      setFilterValues({
        ...filterValues,
        departureFromDate: departureFromDate as string,
        departureToDate: departureToDate as string,
      });
    }
    if (!departureFromDate && !departureToDate) {
      setFilterValues({
        ...filterValues,
        departureFromDate: '',
        departureToDate: '',
      });
    }
  }, [departureFromDate, departureToDate]);

  const handleBookingType = (value: string) => {
    setBookingType(value);
    setFilterValues({
      ...filterValues,
      type: value,
    });
  };
  const handleBookingStatus = (value: string) => {
    setBookingStatus(value);
    setFilterValues({
      ...filterValues,
      status: value,
    });
  };
  const handleBookingId = (e: ChangeEvent<HTMLInputElement>) => {
    setBookingId(e.target.value);
    setFilterValues({
      ...filterValues,
      bookingId: e.target.value,
    });
  };
  const handleEventName = (value: string) => {
    const selected = eventsData.find((event: any) => {
      if (event.value === value) {
        return event;
      }
    });

    setSelectedEvent({
      label: selected?.label || 'any',
      value: value,
    });
    setFilterValues({
      ...filterValues,
      selectedEvent: { label: selected?.label || 'any', value },
    });
  };

  const handleClearArrivalDates = () => {
    setArrivalFromDate('');
    setArrivalToDate('');
  };
  const handleClearDepartureDates = () => {
    setDepartureFromDate('');
    setDepartureToDate('');
  };
  return (
    <section className="flex gap-2 flex-wrap">
      <div className="md:flex-1 flex-wrap md:flex-nowrap flex gap-2 flex-col md:flex-row w-full md:w-auto mb-4">
        <div className="flex-1 min-w-full md:min-w-[160px]">
          <label className="block my-2">{t('booking_card_status')}</label>
          <Select
            className="rounded-full border-black "
            value={bookingStatus}
            options={BOOKING_STATUS_OPTIONS}
            onChange={handleBookingStatus}
            isRequired
          />
        </div>
        <div className="flex-1 min-w-full sm:min-w-[160px]">
          <label className="block my-2">{t('booking_requests_type')}</label>
          <Select
            label=""
            value={bookingType}
            options={BOOKING_TYPE_OPTIONS}
            className="rounded-full border-black"
            onChange={handleBookingType}
            isRequired
          />
        </div>
        <div className="rounded-full flex-1 min-w-full sm:min-w-[160px]">
          <label className="block my-2">
            {t('booking_requests_event_name')}
          </label>
          <Select
            isDisabled={!Boolean(events && filterValues.type === 'event')}
            className={`rounded-full ${
              Boolean(events && filterValues.type === 'event') && 'border-black'
            }`}
            value={selectedEvent.label}
            options={
              events && [
                { label: 'any', value: 'any' },
                ...events.map((event: any) => {
                  return {
                    label: event.toJSON().name,
                    value: event.toJSON()._id,
                  };
                }),
              ]
            }
            onChange={handleEventName}
            isRequired
          />
          {error && <ErrorMessage error={error} />}
        </div>
      </div>
      <div className="md:flex-1 flex-wrap md:flex-nowrap flex gap-2 flex-col md:flex-row w-full md:w-auto mb-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block my-2">
            {t('booking_requests_booking_number')}
          </label>
          <Input
            value={bookingId}
            onChange={handleBookingId as any}
            type="text"
            placeholder={t('booking_id_placeholder')}
            className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
          />
        </div>
        <div ref={arrivalDropdownRef} className="relative flex-1 min-w-[160px]">
          <label className="block my-2">
            {t('booking_requests_arrival_date_range')}
          </label>
          <Button
            onClick={() => setShowArrivalDropdown(!showArrivalDropdown)}
            className="text-black border-black normal-case text-md py-2 text-sm"
            size="small"
            variant="secondary"
          >
            {!arrivalFromDate &&
              !arrivalToDate &&
              t('bookings_select_dates_button')}
            {arrivalFromDate && (
              <>{dayjs(arrivalFromDate).format('DD/MM/YY')} - </>
            )}
            {arrivalToDate && dayjs(arrivalToDate).format('DD/MM/YY')}
          </Button>
          {showArrivalDropdown && (
            <div className="absolute z-10 right-0 bg-white shadow-md rounded-md p-4">
              <DateTimePicker
                setStartDate={setArrivalFromDate as any}
                setEndDate={setArrivalToDate as any}
                savedStartDate={arrivalFromDate}
                savedEndDate={arrivalToDate}
                defaultMonth={new Date()}
              />
              <Button
                isEnabled={Boolean(arrivalToDate && arrivalFromDate)}
                variant="secondary"
                size="small"
                onClick={handleClearArrivalDates}
              >
                {t('booking_requests_clear_dates_button')}
              </Button>
            </div>
          )}
        </div>
        <div
          ref={departureDropdownRef}
          className="relative flex-1 min-w-[160px]"
        >
          <label className="block my-2">
            {t('booking_requests_departure_date_range')}
          </label>
          <Button
            onClick={() => setShowDepartureDropdown(!showDepartureDropdown)}
            className="text-black border-black normal-case py-2 text-sm"
            size="small"
            variant="secondary"
          >
            {!departureFromDate &&
              !departureToDate &&
              t('bookings_select_dates_button')}
            {departureFromDate && (
              <>{dayjs(departureFromDate).format('DD/MM/YY')} - </>
            )}
            {departureToDate && dayjs(departureToDate).format('DD/MM/YY')}
          </Button>
          {showDepartureDropdown && (
            <div className="absolute z-10 right-0 bg-white shadow-md rounded-md p-4">
              <DateTimePicker
                setStartDate={setDepartureFromDate as any}
                setEndDate={setDepartureToDate as any}
                savedStartDate={departureFromDate}
                savedEndDate={departureToDate}
                defaultMonth={new Date()}
              />
              <Button
                isEnabled={Boolean(departureToDate && departureFromDate)}
                variant="secondary"
                size="small"
                onClick={handleClearDepartureDates}
              >
                {t('booking_requests_clear_dates_button')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full"> {t('booking_requests_sort_by')}</div>

      <Button
        isEnabled={filterValues.sortBy !== 'start'}
        onClick={() => setFilterValues({ ...filterValues, sortBy: 'start' })}
        variant="secondary"
        isFullWidth={false}
        size="small"
      >
        {t('booking_requests_arrival_date')}
      </Button>
      <Button
        isEnabled={filterValues.sortBy !== 'end'}
        onClick={() => setFilterValues({ ...filterValues, sortBy: 'end' })}
        variant="secondary"
        isFullWidth={false}
        size="small"
      >
        {t('booking_requests_departure_date')}
      </Button>
      <Button
        isEnabled={filterValues.sortBy !== '-created'}
        onClick={() => setFilterValues({ ...filterValues, sortBy: '-created' })}
        variant="secondary"
        isFullWidth={false}
        size="small"
      >
        {t('booking_requests_newest_first')}
      </Button>
    </section>
  );
};

export default BookingsFilter;
