import { useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { Info, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { BookingSettings } from '../types/api';
import { getMaxBookingHorizon } from '../utils/helpers';
import StayDurationDiscountHints from './booking/stayDurationDiscountHints';
import BookingCoGuests, {
  type BookingCoGuestUser,
} from './BookingCoGuests/BookingCoGuests';
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
  /**
   * Fires whenever the picked dates or guests change, before the search runs.
   * Lets the page tell that the shown results no longer match what is selected.
   */
  onParamsChange?: (params: StaySearchBarParams) => void;
  className?: string;
  /**
   * Overrides the guest/member minimum — /stays/search validates against
   * bookingSettings, not the volunteering minimum, so volunteer flows have to
   * enforce it here or POST /stays rejects the booking later.
   */
  minNightsOverride?: number | null;
  minNightsErrorMessage?: string;
  skipMinDuration?: boolean;
  canSelectDates?: boolean;
  eventStartDate?: string;
  eventEndDate?: string;
  /**
   * Hard bounds on the calendar — used by residence bookings, which can only
   * run inside the project window. They also override the booking horizon.
   */
  minDate?: string | null;
  maxDate?: string | null;
  searchLabel?: string;
  hideSearchButton?: boolean;
  /**
   * Co-guests to send with the booking that this search creates. Draft stays
   * reject edits, so the picker has to live here rather than at checkout —
   * pass both props to switch it on, omit them for plain searches.
   */
  coGuests?: BookingCoGuestUser[];
  onCoGuestsChange?: (coGuests: BookingCoGuestUser[]) => void;
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
  onParamsChange,
  className = '',
  minNightsOverride,
  minNightsErrorMessage,
  skipMinDuration = false,
  canSelectDates = true,
  eventStartDate,
  eventEndDate,
  minDate,
  maxDate,
  searchLabel,
  hideSearchButton = false,
  coGuests,
  onCoGuestsChange,
}: Props) => {
  const t = useTranslations();
  const { user } = useAuth();

  const isMember = !!user?.roles?.includes('member');
  const [maxHorizon] = getMaxBookingHorizon(bookingSettings, isMember);

  const minDuration = skipMinDuration
    ? 0
    : minNightsOverride && minNightsOverride > 0
      ? minNightsOverride
      : isMember
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
    if (minDate) {
      ranges.push({ before: dayjs(minDate).startOf('day').toDate() });
    }
    if (maxDate) {
      ranges.push({ after: dayjs(maxDate).startOf('day').toDate() });
    }
    if (maxHorizon && maxHorizon > 0 && !eventStartDate && !maxDate) {
      ranges.push({
        after: dayjs().add(maxHorizon, 'day').toDate(),
      });
    }
    return ranges;
  }, [maxHorizon, eventStartDate, minDate, maxDate]);

  useEffect(() => {
    if (!canSelectDates && eventStartDate && eventEndDate) {
      setStart(eventStartDate);
      setEnd(eventEndDate);
    }
  }, [canSelectDates, eventStartDate, eventEndDate]);

  const nights = useMemo(
    () => (start && end ? Math.max(0, dayjs(end).diff(dayjs(start), 'day')) : 0),
    [start, end],
  );

  const showCoGuests = Boolean(coGuests && onCoGuestsChange);

  /**
   * Every named co-guest occupies an adult spot alongside the booker, so the
   * head count can never sit below them. Raising it here rather than refusing
   * the add keeps a picked guest from being dropped on the way to POST /stays,
   * which used to happen whenever the count was left at its default of 1.
   */
  const minAdults = (coGuests?.length ?? 0) + 1;

  useEffect(() => {
    if (!coGuests || !onCoGuestsChange) return;
    if (adults < minAdults) {
      setAdults(minAdults);
    }
  }, [adults, minAdults, coGuests, onCoGuestsChange]);

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

  const currentParams: StaySearchBarParams = useMemo(
    () => ({
      start: formatDate(start),
      end: formatDate(end),
      adults,
      children: childrenCount,
      infants,
      pets,
    }),
    [start, end, adults, childrenCount, infants, pets],
  );

  // Held in a ref so an inline callback prop cannot restart the effect below.
  const onParamsChangeRef = useRef(onParamsChange);
  onParamsChangeRef.current = onParamsChange;

  useEffect(() => {
    onParamsChangeRef.current?.(currentParams);
  }, [currentParams]);

  const validationError =
    !skipMinDuration && start && end && nights < minDuration
      ? minNightsErrorMessage ||
        t('bookings_dates_min_duration_error', { var: minDuration })
      : null;

  const canSearch =
    !!start &&
    !!end &&
    (skipMinDuration || nights >= minDuration) &&
    adults >= 1 &&
    !isSearching;

  const handleAddCoGuest = (hit: {
    _id: string;
    screenname: string;
    photo?: string;
  }) => {
    if (!coGuests || !onCoGuestsChange) return false;
    if (hit._id === user?._id) return false;
    if (coGuests.some((guest) => guest._id === hit._id)) return false;
    const next = [
      ...coGuests,
      { _id: hit._id, screenname: hit.screenname, photo: hit.photo },
    ];
    onCoGuestsChange(next);
    // The effect above would catch this too, but setting it here keeps the
    // count and the list in step within the same render.
    if (adults < next.length + 1) {
      setAdults(next.length + 1);
    }
    return true;
  };

  const handleRemoveCoGuest = (userId: string) => {
    if (!coGuests || !onCoGuestsChange) return;
    const next = coGuests.filter((guest) => guest._id !== userId);
    if (next.length === coGuests.length) return;
    onCoGuestsChange(next);
    setAdults((current) =>
      current > coGuests.length + 1 ? current : Math.max(1, next.length + 1),
    );
  };

  const handleSearch = () => {
    if (!canSearch || validationError) return;
    onSearch(currentParams);
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
            {canSelectDates ? (
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
            ) : (
              <div
                className="flex flex-col items-start text-left px-4 md:px-5 py-2.5 md:py-3 rounded-none sm:rounded-full min-h-[52px] sm:min-h-[56px] w-full cursor-default"
                aria-disabled="true"
              >
                <span className="text-[11px] font-semibold text-gray-500 inline-flex items-center gap-1">
                  <span className="opacity-70">
                    {t('stay_search_bar_when')}
                  </span>
                  <span
                    className="relative group/info inline-flex"
                    tabIndex={0}
                    aria-label={t('stay_search_bar_event_dates_fixed_hint')}
                  >
                    <Info className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] font-normal leading-snug text-gray-600 opacity-0 shadow-md transition-opacity group-hover/info:opacity-100 group-focus/info:opacity-100"
                    >
                      {t('stay_search_bar_event_dates_fixed_hint')}
                    </span>
                  </span>
                </span>
                <span className="text-sm md:text-base font-medium text-gray-900 opacity-70">
                  {datesLabel}
                  {nights > 0 && (
                    <span className="text-gray-500 font-normal">
                      {' '}
                      · {t('bookings_dates_nights_selected', { count: nights })}
                    </span>
                  )}
                </span>
              </div>
            )}
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
              {openPopover === 'dates' && canSelectDates ? (
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
                    eventStartDate={eventStartDate}
                    eventEndDate={eventEndDate}
                    defaultMonth={
                      eventStartDate
                        ? new Date(eventStartDate)
                        : minDate
                        ? new Date(minDate)
                        : undefined
                    }
                  />
                  <StayDurationDiscountHints
                    bookingSettings={bookingSettings}
                  />
                </div>
              ) : openPopover === 'guests' ? (
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
                    minAdults={showCoGuests ? minAdults : 1}
                  />
                  {showCoGuests && (
                    <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-900">
                          {t('booking_co_guests_add_title')}
                        </p>
                        <p className="text-[11px] leading-snug text-gray-500">
                          {t('booking_co_guests_add_smallprint')}
                        </p>
                      </div>
                      <BookingCoGuests
                        guests={coGuests!}
                        canEdit
                        excludeUserIds={user?._id ? [user._id] : []}
                        adults={adults}
                        maxCoGuests={coGuests!.length + 1}
                        inlineResults
                        onAdd={handleAddCoGuest}
                        onRemove={handleRemoveCoGuest}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!hideSearchButton && (
          <div className="p-3 sm:p-1.5 flex items-stretch sm:items-center justify-center sm:justify-end shrink-0">
            <Button
              type="button"
              onClick={handleSearch}
              isEnabled={!!canSearch && !validationError}
              isLoading={isSearching}
              isFullWidth={false}
              className={`!rounded-full !px-6 min-h-[44px] w-full sm:!w-auto flex items-center justify-center gap-2 ${btnNormalCase}`}
            >
              <Search
                className="h-[1.125rem] w-[1.125rem] shrink-0"
                aria-hidden
              />
              {searchLabel || t('stay_search_bar_search')}
            </Button>
          </div>
        )}
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
