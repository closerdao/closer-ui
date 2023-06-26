import Head from 'next/head';

import { useEffect, useState } from 'react';

import Bookings from '../../components/Bookings';
import DateTimePicker from '../../components/DateTimePicker';
import { Button, ErrorMessage, Input } from '../../components/ui';
import Heading from '../../components/ui/Heading';
import Select from '../../components/ui/Select/Dropdown';

import dayjs from 'dayjs';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useOutsideClick } from '../../hooks/useOutsideClick';
import { __ } from '../../utils/helpers';
import PageNotFound from '../404';

const MAX_BOOKINGS = 200;

const statusOptions = [
  { label: 'Any', value: 'any' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Open', value: 'open' },
]

const typeOptions = [
  { label: 'Any', value: 'any' },
  { label: 'Volunteering', value: 'volunteer' },
  { label: 'Event', value: 'event' },
  { label: 'Stay', value: 'stay' },
]

const loadTime = new Date();

const BookingsRequests = () => {
  const { user } = useAuth();
  const { platform }: any = usePlatform();
  const arrivalDropdownRef = useOutsideClick(handleClickOutsideArrivalDropdown);
  const departureDropdownRef = useOutsideClick(handleClickOutsideDepartureDropdown);

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
  const [departureToDate, setDepartureToDate] = useState<string | undefined>('');
  const [departureFromDate, setDepartureFromDate] = useState<string | undefined>('');
  const [showArrivalDropdown, setShowArrivalDropdown] = useState(false);
  const [showDepartureDropdown, setShowDepartureDropdown] = useState(false);

  const [filter, setFilter] = useState({
    where: {
      end: { $gt: new Date() },
    },
  });

  const [filterValues, setFilterValues] = useState({
    type: 'any',
    status: 'any',
    bookingId: '',
    selectedEvent: { label: 'any', value: '' },
    arrivalFromDate: '',
    arrivalToDate: '',
    departureFromDate: '',
    departureToDate: '',
  });

  const [error, setError] = useState(false);
  const eventsFilter = {
    where: {
      end: { $gt: loadTime },
    },
    limit: 10,
  };

  const events = platform.event.find(eventsFilter);

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
      sort_by: 'start',
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
  const handleBookingId = (value: string) => {
    setBookingId(value);
    setFilterValues({
      ...filterValues,
      bookingId: value,
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
  }
  const handleClearDepartureDates = () => {
    setDepartureFromDate('');
    setDepartureToDate('');
  }

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{__('booking_requests_title')}</title>
      </Head>
      <div className="max-w-screen-lg mx-auto flex flex-col gap-10">
        <Heading level={1}>{__('booking_requests_title')}</Heading>

        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[160px] min-w-[160px]">
            <div>{ __('booking_card_status')}</div>
            <Select
               className="rounded-full border-black py-1.5"
              value={bookingStatus}
              options={statusOptions}
              onChange={handleBookingStatus}
              isRequired
            />
          </div>
          <div className="flex-1 min-w-[160px] ">
            <div>{ __('booking_requests_type')}</div>
            <Select
              label=""
              value={bookingType}
              options={typeOptions}
              className="rounded-full border-black py-1.5"
              onChange={handleBookingType}
              isRequired
            />
          </div>
          {events && filterValues.type === 'event' && (
            <div className="rounded-full flex-1 min-w-[160px]">
              <div>Event Name</div>
              <Select
                 className="rounded-full border-black py-1.5"
                value={selectedEvent.label}
                options={[
                  { label: 'any', value: 'any' },
                  ...events.map((event: any) => {
                    return {
                      label: event.toJSON().name,
                      value: event.toJSON()._id,
                    };
                  }),
                ]}
                onChange={handleEventName}
                isRequired
              />
              {error && <ErrorMessage error={error} />}
            </div>
          )}

          <div className="flex-1 min-w-[160px]">
            <div>{__('booking_requests_booking_number')}</div>
            <Input
              value={bookingId}
              onChange={handleBookingId}
              type="text"
              placeholder={__('booking_id_placeholder')}
              className="m-0 border-black border-2 rounded-full py-1.5 bg-white"
            />
          </div>

          <div ref={arrivalDropdownRef} className="relative flex-1 min-w-[160px]">
            <div>{ __('booking_requests_arrival_date_range')}</div>
            <Button
              onClick={() => setShowArrivalDropdown(!showArrivalDropdown)}
              className='text-black border-black normal-case text-md py-1.5 text-base'
              size="small"
              type="secondary"
            >
              {!arrivalFromDate && !arrivalToDate && __('bookings_select_dates_button')}
              {arrivalFromDate && (<>{dayjs(arrivalFromDate).format('DD/MM/YY')} - </>)} 
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
                <Button isEnabled={Boolean(arrivalToDate && arrivalFromDate)}  type='secondary' size='small' onClick={handleClearArrivalDates}>{ __('booking_requests_clear_dates_button')}</Button>
              </div>
            )}
          </div>
          
          <div ref={departureDropdownRef} className="relative flex-1 min-w-[160px]">
          <div>{ __('booking_requests_departure_date_range')}</div>
            <Button
              onClick={() => setShowDepartureDropdown(!showDepartureDropdown)}
              className='text-black border-black normal-case text-md py-1.5'
              size="small"
              type="secondary"
            >
              {!departureFromDate && !departureToDate && __('bookings_select_dates_button')}
              {departureFromDate && (<>{dayjs(departureFromDate).format('DD/MM/YY')} - </>)} 
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
                <Button isEnabled={Boolean(departureToDate && departureFromDate)} type='secondary' size='small' onClick={handleClearDepartureDates}>{ __('booking_requests_clear_dates_button')}</Button>
              </div>
            )}
          </div>
        </div>

        <section
          className={`relative  min-h-[100vh] ${
            (showArrivalDropdown || showDepartureDropdown) && 'z-[-1]'
          }`}
        >
          <Bookings filter={filter} />
        </section>
      </div>
    </>
  );
};

export default BookingsRequests;
