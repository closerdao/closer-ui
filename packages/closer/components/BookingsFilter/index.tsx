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

import { usePlatform } from '../../contexts/platform';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { __ } from '../../utils/helpers';

const statusOptions = [
  { label: 'Any', value: 'any' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Open', value: 'open' },
];

const typeOptions = [
  { label: 'Any', value: 'any' },
  { label: 'Volunteering', value: 'volunteer' },
  { label: 'Event', value: 'event' },
  { label: 'Stay', value: 'stay' },
];

const MAX_BOOKINGS = 200;
const loadTime = new Date();

interface Props {
  setFilter: Dispatch<SetStateAction<any>>;
}

const BookingsFilter = ({ setFilter }: Props) => {
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
    limit: 10,
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
  }, []);

  useEffect(() => {
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
        ...(filterValues.status === 'paid' && { status: ['paid'] }),
        ...(filterValues.status === 'open' && { status: ['open'] }),
        ...(filterValues.status === 'pending' && { status: ['pending'] }),
        ...(filterValues.bookingId !== '' && { _id: filterValues.bookingId }),
        ...(filterValues.selectedEvent.label !== 'any' && {
          eventId: filterValues.selectedEvent.value,
        }),

        ...(filterValues.arrivalToDate &&
          filterValues.arrivalFromDate && {
            start: {
              $lt: new Date(filterValues.arrivalToDate),
              $gt: new Date(filterValues.arrivalFromDate),
            },
          }),
        ...(filterValues.departureToDate &&
          filterValues.departureFromDate && {
            end: {
              $lt: new Date(filterValues.departureToDate),
              $gt: new Date(filterValues.departureFromDate),
            },
          }),
        ...(!filterValues.departureToDate &&
          !filterValues.departureFromDate && { end: { $gt: new Date() } }),
      },
      limit: MAX_BOOKINGS,
      sort_by: filterValues.sortBy || 'start',
    };

    setFilter(getFilter as any);
  }, [filterValues]);

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
          <label className="block my-2">{__('booking_card_status')}</label>
          <Select
            className="rounded-full border-black py-1.5"
            value={bookingStatus}
            options={statusOptions}
            onChange={handleBookingStatus}
            isRequired
          />
        </div>
        <div className="flex-1 min-w-full sm:min-w-[160px]">
          <label className="block my-2">{__('booking_requests_type')}</label>
          <Select
            label=""
            value={bookingType}
            options={typeOptions}
            className="rounded-full border-black py-1.5"
            onChange={handleBookingType}
            isRequired
          />
        </div>
        <div className="rounded-full flex-1 min-w-full sm:min-w-[160px]">
          <label className="block my-2">
            {__('booking_requests_event_name')}
          </label>
          <Select
            isDisabled={!Boolean(events && filterValues.type === 'event')}
            className={`rounded-full  py-1.5 ${
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
            {__('booking_requests_booking_number')}
          </label>
          <Input
            value={bookingId}
            onChange={handleBookingId as any}
            type="text"
            placeholder={__('booking_id_placeholder')}
            className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
          />
        </div>
        <div ref={arrivalDropdownRef} className="relative flex-1 min-w-[160px]">
          <label className="block my-2">
            {__('booking_requests_arrival_date_range')}
          </label>
          <Button
            onClick={() => setShowArrivalDropdown(!showArrivalDropdown)}
            className="text-black border-black normal-case text-md py-2 text-sm"
            size="small"
            type="secondary"
          >
            {!arrivalFromDate &&
              !arrivalToDate &&
              __('bookings_select_dates_button')}
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
                type="secondary"
                size="small"
                onClick={handleClearArrivalDates}
              >
                {__('booking_requests_clear_dates_button')}
              </Button>
            </div>
          )}
        </div>
        <div
          ref={departureDropdownRef}
          className="relative flex-1 min-w-[160px]"
        >
          <label className="block my-2">
            {__('booking_requests_departure_date_range')}
          </label>
          <Button
            onClick={() => setShowDepartureDropdown(!showDepartureDropdown)}
            className="text-black border-black normal-case py-2 text-sm"
            size="small"
            type="secondary"
          >
            {!departureFromDate &&
              !departureToDate &&
              __('bookings_select_dates_button')}
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
                type="secondary"
                size="small"
                onClick={handleClearDepartureDates}
              >
                {__('booking_requests_clear_dates_button')}
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full"> {__('booking_requests_sort_by')}</div>

      <Button
        isEnabled={filterValues.sortBy !== 'start'}
        onClick={() => setFilterValues({ ...filterValues, sortBy: 'start' })}
        type="secondary"
        isFullWidth={false}
        size="small"
      >
        {__('booking_requests_arrival_date')}
      </Button>
      <Button
        isEnabled={filterValues.sortBy !== 'end'}
        onClick={() => setFilterValues({ ...filterValues, sortBy: 'end' })}
        type="secondary"
        isFullWidth={false}
        size="small"
      >
        {__('booking_requests_departure_date')}
      </Button>
    </section>
  );
};

export default BookingsFilter;
