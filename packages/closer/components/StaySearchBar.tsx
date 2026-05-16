import { useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { BookingSettings } from '../types/api';
import { getMaxBookingHorizon } from '../utils/helpers';
import StayDurationDiscountHints from './booking/stayDurationDiscountHints';
import BookingGuests from './BookingGuests';
import DateTimePicker from './DateTimePicker';
import Button from './ui/Button';
import { ErrorMessage } from './ui';

export type StaySearchBarParams = {
  start: string;
  end: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
};

interface Props {
  bookingSettings: BookingSettings | null;
  initialStart?: string | Date | null;
  initialEnd?: string | Date | null;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
  initialPets?: number;
  isSearching?: boolean;
  externalError?: string | null;
  onSearch: (params: StaySearchBarParams) => void;
  className?: string;
}

const formatDate = (d: Date | string | null) =>
  d ? dayjs(d).format('YYYY-MM-DD') : '';

const StaySearchBar = ({
  bookingSettings,
  initialStart,
  initialEnd,
  initialAdults = 1,
  initialChildren = 0,
  initialInfants = 0,
  initialPets = 0,
  isSearching = false,
  externalError,
  onSearch,
  className = '',
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();

  const isMember = !!user?.roles?.includes('member');
  const [maxHorizon] = getMaxBookingHorizon(bookingSettings, isMember);

  const minDuration = isMember
    ? bookingSettings?.memberMinDuration || 1
    : bookingSettings?.minDuration || 1;

  const defaultSearchStart = useMemo(
    () => dayjs().add(14, 'day').startOf('day'),
    [],
  );

  const hasInitialStart =
    initialStart != null &&
    (typeof initialStart !== 'string' || initialStart.trim() !== '');
  const hasInitialEnd =
    initialEnd != null &&
    (typeof initialEnd !== 'string' || initialEnd.trim() !== '');

  const [start, setStart] = useState<string | Date | null>(() =>
    hasInitialStart ? initialStart! : defaultSearchStart.toDate(),
  );
  const [end, setEnd] = useState<string | Date | null>(() => {
    if (hasInitialEnd) return initialEnd!;
    const startBase = hasInitialStart
      ? dayjs(initialStart).startOf('day')
      : defaultSearchStart.clone();
    return startBase.add(minDuration, 'day').toDate();
  });
  const [adults, setAdults] = useState<number>(initialAdults);
  const [childrenCount, setChildrenCount] = useState<number>(initialChildren);
  const [infants, setInfants] = useState<number>(initialInfants);
  const [pets, setPets] = useState<number>(initialPets);

  const [openPopover, setOpenPopover] = useState<'dates' | 'guests' | null>(
    null,
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const datesTriggerRef = useRef<HTMLButtonElement>(null);
  const guestsTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!openPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !datesTriggerRef.current?.contains(target) &&
        !guestsTriggerRef.current?.contains(target)
      ) {
        setOpenPopover(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPopover(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [openPopover]);

  const blockedDateRanges = useMemo(() => {
    const ranges: any[] = [{ before: new Date() }];
    if (maxHorizon && maxHorizon > 0) {
      ranges.push({
        after: dayjs().add(maxHorizon, 'day').toDate(),
      });
    }
    return ranges;
  }, [maxHorizon]);

  const nights = useMemo(
    () => (start && end ? Math.max(0, dayjs(end).diff(dayjs(start), 'day')) : 0),
    [start, end],
  );

  const totalGuests = adults + childrenCount;
  const guestsLabel =
    totalGuests <= 1
      ? t('stay_search_bar_guests_one')
      : t('stay_search_bar_guests_many', { count: totalGuests });
  const guestsExtras = infants + pets;
  const guestsExtrasLabel =
    guestsExtras > 0
      ? t('stay_search_bar_guests_extras', { count: guestsExtras })
      : null;

  const datesLabel = useMemo(() => {
    if (!start || !end) return t('stay_search_bar_dates_placeholder');
    return `${dayjs(start).format('MMM D')} – ${dayjs(end).format('MMM D')}`;
  }, [start, end, t]);

  const validationError =
    start && end && nights < minDuration
      ? t('bookings_dates_min_duration_error', { var: minDuration })
      : null;

  const canSearch =
    !!start && !!end && nights >= minDuration && adults >= 1 && !isSearching;

  const handleSearch = () => {
    if (!canSearch || validationError) return;
    onSearch({
      start: formatDate(start),
      end: formatDate(end),
      adults,
      children: childrenCount,
      infants,
      pets,
    });
  };

  const sectionBtnBase =
    'flex flex-col items-start text-left px-4 md:px-5 py-2.5 md:py-3 rounded-none sm:rounded-full transition-colors min-h-[52px] sm:min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 hover:bg-gray-50 w-full';
  const sectionBtnActive = 'bg-white sm:shadow-md sm:ring-1 sm:ring-gray-200';

  const btnNormalCase = '!normal-case tracking-normal';

  return (
    <div className={`relative max-w-full ${className}`}>
      <div
        role="search"
        aria-label={t('stay_search_bar_label')}
        className="rounded-2xl sm:rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row items-stretch divide-y sm:divide-y-0 divide-gray-200 overflow-visible"
      >
        <div className="relative flex flex-1 min-w-0 flex-col sm:flex-row sm:divide-x sm:divide-gray-200 divide-y sm:divide-y-0 divide-gray-200">
          <div className="relative min-h-0 min-w-0 flex-1">
            <button
              ref={datesTriggerRef}
              type="button"
              onClick={() =>
                setOpenPopover(openPopover === 'dates' ? null : 'dates')
              }
              aria-haspopup="dialog"
              aria-expanded={openPopover === 'dates'}
              aria-controls="stay-search-bar-panel"
              className={`${sectionBtnBase} ${
                openPopover === 'dates' ? sectionBtnActive : ''
              }`}
            >
              <span className="text-[11px] font-semibold text-gray-500">
                {t('stay_search_bar_when')}
              </span>
              <span className="text-sm md:text-base font-medium text-gray-900">
                {datesLabel}
                {nights > 0 && (
                  <span className="text-gray-500 font-normal">
                    {' '}
                    · {t('bookings_dates_nights_selected', { count: nights })}
                  </span>
                )}
              </span>
            </button>
          </div>

          <div className="relative min-h-0 min-w-0 flex-1">
            <button
              ref={guestsTriggerRef}
              type="button"
              onClick={() =>
                setOpenPopover(openPopover === 'guests' ? null : 'guests')
              }
              aria-haspopup="dialog"
              aria-expanded={openPopover === 'guests'}
              aria-controls="stay-search-bar-panel"
              className={`${sectionBtnBase} ${
                openPopover === 'guests' ? sectionBtnActive : ''
              }`}
            >
              <span className="text-[11px] font-semibold text-gray-500">
                {t('stay_search_bar_who')}
              </span>
              <span className="text-sm md:text-base font-medium text-gray-900">
                {guestsLabel}
                {guestsExtrasLabel && (
                  <span className="text-gray-500 font-normal">
                    {' '}
                    · {guestsExtrasLabel}
                  </span>
                )}
              </span>
            </button>
          </div>

          {openPopover && (
            <div
              ref={panelRef}
              id="stay-search-bar-panel"
              role="presentation"
              className={`absolute top-full z-40 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg max-h-[min(75vh,640px)] sm:max-h-[min(70vh,560px)] ${
                openPopover === 'dates'
                  ? 'left-0 w-max max-w-[calc(100vw-2rem)]'
                  : 'left-0 right-0 w-full max-w-full sm:left-auto sm:right-0 sm:w-72 sm:max-w-[calc(100vw-2rem)]'
              }`}
            >
              {openPopover === 'dates' ? (
                <div
                  className="flex w-max max-w-full min-h-0 flex-col overflow-y-auto overscroll-contain px-3 py-3"
                  role="dialog"
                  aria-label={t('stay_search_bar_dates_dialog_label')}
                >
                  <DateTimePicker
                    hideSelectionSummary
                    compactCalendar
                    setStartDate={setStart}
                    setEndDate={setEnd}
                    blockedDateRanges={blockedDateRanges}
                    savedStartDate={start as string | Date | null}
                    savedEndDate={end as string | Date | null}
                  />
                  <StayDurationDiscountHints bookingSettings={bookingSettings} />
                </div>
              ) : (
                <div
                  className="flex w-full min-h-0 flex-col overflow-y-auto overscroll-contain px-3 py-3 sm:w-72"
                  role="dialog"
                  aria-label={t('stay_search_bar_guests_dialog_label')}
                >
                  <BookingGuests
                    shouldHideTitle
                    adults={adults}
                    kids={childrenCount}
                    infants={infants}
                    pets={pets}
                    setAdults={setAdults}
                    setKids={setChildrenCount}
                    setInfants={setInfants}
                    setPets={setPets}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-1.5 flex items-stretch sm:items-center justify-center sm:justify-end shrink-0">
          <Button
            type="button"
            onClick={handleSearch}
            isEnabled={!!canSearch && !validationError}
            isLoading={isSearching}
            isFullWidth={false}
            className={`!rounded-full !px-6 min-h-[44px] w-full sm:!w-auto flex items-center justify-center gap-2 ${btnNormalCase}`}
          >
            <Search className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
            {t('stay_search_bar_search')}
          </Button>
        </div>
      </div>

      {(validationError || externalError) && (
        <div className="mt-2" role="alert" aria-live="polite">
          {validationError && <ErrorMessage error={validationError} />}
          {externalError && <ErrorMessage error={externalError} />}
        </div>
      )}
    </div>
  );
};

export default StaySearchBar;
