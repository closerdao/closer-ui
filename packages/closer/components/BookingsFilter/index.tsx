import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import DateTimePicker from '../../components/DateTimePicker';
import { Button, ErrorMessage } from '../../components/ui';

import dayjs from 'dayjs';
import { Calendar, ChevronDown, Filter, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  BOOKINGS_PER_PAGE,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE_OPTIONS,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';

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
  
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const [bookingType, setBookingType] = useState('any');
  const [bookingStatus, setBookingStatus] = useState('any');
  const [bookingId, setBookingId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState({
    label: 'any',
    value: 'any',
  });

  const [dateFrom, setDateFrom] = useState<string | undefined>('');
  const [dateTo, setDateTo] = useState<string | undefined>('');

  const [filterValues, setFilterValues] = useState({
    type: 'any',
    status: 'any',
    bookingId: '',
    selectedEvent: { label: 'any', value: '' },
    dateFrom: '',
    dateTo: '',
    sortBy: '-created',
  });

  const eventsFilter = {
    where: {
      end: { $gt: loadTime },
    },
  };

  const events = platform?.event?.find(eventsFilter);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const dateFromObj = new Date(filterValues.dateFrom);
    dateFromObj.setDate(dateFromObj.getDate() - 1);

    const isDefaultFilter =
      !filterValues.dateTo &&
      !filterValues.dateFrom &&
      filterValues.status === 'any';

    const getFilter = {
      where: {
        ...(filterValues.type === 'event' && { eventId: { $exists: true } }),
        ...(filterValues.type === 'volunteer' && {
          'volunteerInfo.bookingType': 'volunteer'
        }),
        ...(filterValues.type === 'residency' && {
          'volunteerInfo.bookingType': 'residence'
        }),
        ...(filterValues.type === 'stay' && {
          volunteerId: { $exists: false },
          volunteerInfo: { $exists: false },
          eventId: { $exists: false },
        }),
        ...(filterValues.status !== 'any'
          ? { status: [bookingStatus] }
          : { status: { $ne: 'open' } }),
        ...(filterValues.bookingId !== '' && { _id: filterValues.bookingId }),
        ...(filterValues.selectedEvent.label !== 'any' && {
          eventId: filterValues.selectedEvent.value,
        }),
        ...(filterValues.dateTo &&
          filterValues.dateFrom && {
            start: {
              $lte: new Date(filterValues.dateTo),
              $gte: dateFromObj,
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
    if (dateFrom && dateTo) {
      setFilterValues({
        ...filterValues,
        dateFrom: dateFrom as string,
        dateTo: dateTo as string,
      });
    }
    if (!dateFrom && !dateTo) {
      setFilterValues({
        ...filterValues,
        dateFrom: '',
        dateTo: '',
      });
    }
  }, [dateFrom, dateTo]);

  const handleBookingId = (e: ChangeEvent<HTMLInputElement>) => {
    setBookingId(e.target.value);
    setFilterValues({
      ...filterValues,
      bookingId: e.target.value,
    });
  };

  const handleClearDates = () => {
    setDateFrom('');
    setDateTo('');
  };

  const activeFiltersCount = [
    filterValues.status !== 'any',
    filterValues.type !== 'any',
    filterValues.selectedEvent.label !== 'any',
  ].filter(Boolean).length;

  const sortOptions = [
    { key: '-created', label: t('booking_requests_newest_first') },
    { key: 'start', label: t('booking_requests_arrival_date') },
    { key: 'end', label: t('booking_requests_departure_date') },
  ];

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-2">
      <div className="flex flex-wrap gap-1.5 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={bookingId}
            onChange={handleBookingId}
            type="text"
            placeholder={t('booking_id_placeholder')}
            className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>

        <div ref={datePickerRef} className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              dateFrom && dateTo
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {dateFrom && dateTo
              ? `${dayjs(dateFrom).format('DD/MM')} - ${dayjs(dateTo).format('DD/MM')}`
              : t('bookings_select_dates_button')}
            {dateFrom && dateTo && (
              <X
                className="w-3 h-3 ml-1 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearDates();
                }}
              />
            )}
          </button>
          {showDatePicker && (
            <>
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowDatePicker(false)}
              />
              <div className="fixed inset-4 z-50 bg-white rounded-lg shadow-xl flex flex-col md:absolute md:inset-auto md:z-20 md:right-0 md:top-full md:mt-1 md:shadow-lg md:border md:border-gray-200">
                <div className="flex items-center justify-between p-4 border-b md:hidden">
                  <span className="font-medium">{t('bookings_select_dates_button')}</span>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center">
                  <DateTimePicker
                    setStartDate={setDateFrom as any}
                    setEndDate={setDateTo as any}
                    savedStartDate={dateFrom}
                    savedEndDate={dateTo}
                    defaultMonth={new Date()}
                  />
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Button
                    isEnabled={Boolean(dateTo && dateFrom)}
                    variant="secondary"
                    size="small"
                    onClick={handleClearDates}
                    className="flex-1"
                  >
                    {t('booking_requests_clear_dates_button')}
                  </Button>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 md:hidden"
                  >
                    {t('generic_done')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <div ref={filtersRef} className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              activeFiltersCount > 0
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            {t('booking_requests_filters')}
            {activeFiltersCount > 0 && (
              <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {showFilters && (
            <div className="absolute z-20 right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 p-4 min-w-[280px]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking_card_status')}
                  </label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => {
                      setBookingStatus(e.target.value);
                      setFilterValues({ ...filterValues, status: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {BOOKING_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('booking_requests_type')}
                  </label>
                  <select
                    value={bookingType}
                    onChange={(e) => {
                      setBookingType(e.target.value);
                      setFilterValues({ ...filterValues, type: e.target.value });
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {BOOKING_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {events && filterValues.type === 'event' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('booking_requests_event_name')}
                    </label>
                    <select
                      value={selectedEvent.value}
                      onChange={(e) => {
                        const selected = events.find((ev: any) => ev.get('_id') === e.target.value);
                        setSelectedEvent({
                          label: selected?.get('name') || 'any',
                          value: e.target.value,
                        });
                        setFilterValues({
                          ...filterValues,
                          selectedEvent: { label: selected?.get('name') || 'any', value: e.target.value },
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="any">Any</option>
                      {events.map((event: any) => (
                        <option key={event.get('_id')} value={event.get('_id')}>
                          {event.get('name')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setBookingStatus('any');
                      setBookingType('any');
                      setSelectedEvent({ label: 'any', value: 'any' });
                      setFilterValues({
                        ...filterValues,
                        status: 'any',
                        type: 'any',
                        selectedEvent: { label: 'any', value: 'any' },
                      });
                    }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
                  >
                    {t('booking_requests_clear_filters')}
                  </button>
                )}
              </div>
              {error && <ErrorMessage error={error} />}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500 mr-1">{t('booking_requests_sort_by')}:</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilterValues({ ...filterValues, sortBy: opt.key })}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterValues.sortBy === opt.key
                  ? 'bg-accent text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BookingsFilter;
