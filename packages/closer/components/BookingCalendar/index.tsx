import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';

import { cn } from '../../utils/cn';

interface Booking {
  id: string;
  start: Date;
  end: Date;
  title: string;
  status: string;
  listingId: string;
  userName?: string;
}

interface Listing {
  id: string;
  name: string;
  listingId: string;
}

interface BookingCalendarProps {
  listings: Listing[];
  bookings: Booking[];
  isLoading?: boolean;
  loadedRange?: { start: Date; end: Date };
  onDateRangeChange?: (start: Date, end: Date) => void;
  onBookingClick?: (bookingId: string) => void;
}

const CELL_WIDTH = 40;
const CELL_HEIGHT = 48;
const SIDEBAR_WIDTH = 200;

const statusColors: Record<string, string> = {
  paid: 'bg-green-500',
  'checked-in': 'bg-blue-500',
  'checked-out': 'bg-gray-400',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
};

const BookingCalendar = ({
  listings,
  bookings,
  isLoading = false,
  loadedRange,
  onDateRangeChange,
  onBookingClick,
}: BookingCalendarProps) => {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const [visibleRange, setVisibleRange] = useState<{ start: Date; end: Date }>({
    start: dayjs().subtract(7, 'day').startOf('day').toDate(),
    end: dayjs().add(60, 'day').startOf('day').toDate(),
  });

  const dates = useMemo(() => {
    const result: Date[] = [];
    let current = dayjs(visibleRange.start);
    const end = dayjs(visibleRange.end);
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      result.push(current.toDate());
      current = current.add(1, 'day');
    }
    return result;
  }, [visibleRange]);

  const months = useMemo(() => {
    const result: { month: string; startIndex: number; days: number }[] = [];
    let currentMonth = '';
    dates.forEach((date, index) => {
      const monthKey = dayjs(date).format('MMMM YYYY');
      if (monthKey !== currentMonth) {
        if (result.length > 0) {
          result[result.length - 1].days = index - result[result.length - 1].startIndex;
        }
        result.push({ month: monthKey, startIndex: index, days: 0 });
        currentMonth = monthKey;
      }
    });
    if (result.length > 0) {
      result[result.length - 1].days = dates.length - result[result.length - 1].startIndex;
    }
    return result;
  }, [dates]);

  const isDateLoaded = useCallback((date: Date) => {
    if (!loadedRange) return true;
    const d = dayjs(date);
    return d.isAfter(dayjs(loadedRange.start).subtract(1, 'day')) && 
           d.isBefore(dayjs(loadedRange.end).add(1, 'day'));
  }, [loadedRange]);

  const getBookingsForListing = useCallback((listingId: string) => {
    return bookings.filter((b) => b.listingId === listingId);
  }, [bookings]);

  const getBookingPosition = useCallback((booking: Booking) => {
    const startDate = dayjs(booking.start).startOf('day');
    const endDate = dayjs(booking.end).startOf('day');
    const rangeStart = dayjs(visibleRange.start);
    
    const startOffset = startDate.diff(rangeStart, 'day');
    const duration = endDate.diff(startDate, 'day') + 1;
    
    return {
      left: Math.max(0, startOffset) * CELL_WIDTH,
      width: Math.min(duration, dates.length - Math.max(0, startOffset)) * CELL_WIDTH - 4,
      isPartialStart: startOffset < 0,
      isPartialEnd: endDate.isAfter(dayjs(visibleRange.end)),
    };
  }, [visibleRange, dates.length]);

  const syncHorizontalScroll = useCallback((source: 'header' | 'body') => {
    if (isScrolling.current) return;
    isScrolling.current = true;
    
    const sourceRef = source === 'header' ? headerScrollRef : bodyScrollRef;
    const targetRef = source === 'header' ? bodyScrollRef : headerScrollRef;
    
    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }
    
    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  const syncVerticalScroll = useCallback(() => {
    if (bodyScrollRef.current && sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTop = bodyScrollRef.current.scrollTop;
    }
  }, []);

  const handleBodyScroll = useCallback(() => {
    syncHorizontalScroll('body');
    syncVerticalScroll();
    
    if (!bodyScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = bodyScrollRef.current;
    
    if (scrollLeft < 200) {
      const newStart = dayjs(visibleRange.start).subtract(30, 'day').toDate();
      setVisibleRange((prev) => ({ ...prev, start: newStart }));
      onDateRangeChange?.(newStart, visibleRange.end);
    }
    
    if (scrollWidth - scrollLeft - clientWidth < 200) {
      const newEnd = dayjs(visibleRange.end).add(30, 'day').toDate();
      setVisibleRange((prev) => ({ ...prev, end: newEnd }));
      onDateRangeChange?.(visibleRange.start, newEnd);
    }
  }, [visibleRange, onDateRangeChange, syncHorizontalScroll, syncVerticalScroll]);

  useEffect(() => {
    if (bodyScrollRef.current) {
      const todayIndex = dates.findIndex((d) => dayjs(d).isSame(dayjs(), 'day'));
      if (todayIndex > 0) {
        const scrollPosition = Math.max(0, (todayIndex - 3) * CELL_WIDTH);
        bodyScrollRef.current.scrollLeft = scrollPosition;
        if (headerScrollRef.current) {
          headerScrollRef.current.scrollLeft = scrollPosition;
        }
      }
    }
  }, [dates]);

  const today = dayjs().startOf('day');
  const gridWidth = dates.length * CELL_WIDTH;

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-white relative">
      <div className="flex border-b border-gray-200">
        <div
          className="flex-shrink-0 bg-gray-50 border-r border-gray-200 px-4 flex items-end pb-2 font-medium text-gray-700"
          style={{ width: SIDEBAR_WIDTH, height: 72 }}
        >
          Listings
        </div>

        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          onScroll={() => syncHorizontalScroll('header')}
          style={{ height: 72 }}
        >
          <div style={{ width: gridWidth }}>
            <div className="flex border-b border-gray-100" style={{ height: 28 }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  className="text-sm font-semibold text-gray-700 px-2 py-1 truncate"
                  style={{ width: m.days * CELL_WIDTH }}
                >
                  {m.month}
                </div>
              ))}
            </div>
            <div className="flex" style={{ height: 44 }}>
              {dates.map((date, i) => {
                const d = dayjs(date);
                const isToday = d.isSame(today, 'day');
                const isWeekend = d.day() === 0 || d.day() === 6;
                const loaded = isDateLoaded(date);
                
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex flex-col items-center justify-center text-xs border-r border-gray-100',
                      isWeekend && 'bg-gray-50',
                      isToday && 'bg-blue-50'
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span className={cn('text-gray-500 text-[10px]', isToday && 'text-blue-600')}>
                      {d.format('ddd')}
                    </span>
                    <span
                      className={cn(
                        'font-medium text-sm',
                        isToday 
                          ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                          : 'text-gray-900'
                      )}
                    >
                      {d.format('D')}
                    </span>
                    {isLoading && !loaded && (
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: 300 }}>
        <div
          ref={sidebarScrollRef}
          className="flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-hidden"
          style={{ width: SIDEBAR_WIDTH }}
        >
          {listings.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm">No listings</div>
          ) : (
            listings.map((listing, index) => (
              <div
                key={listing.id || index}
                className="px-4 border-b border-gray-100 flex items-center text-sm font-medium text-gray-700 truncate hover:bg-gray-100 transition-colors"
                style={{ height: CELL_HEIGHT }}
                title={listing.name}
              >
                {listing.name}
              </div>
            ))
          )}
        </div>

        <div
          ref={bodyScrollRef}
          className="flex-1 overflow-auto"
          onScroll={handleBodyScroll}
        >
          <div style={{ width: gridWidth }}>
            {listings.map((listing, listingIndex) => {
              const listingBookings = getBookingsForListing(listing.id);
              
              return (
                <div
                  key={listing.id || listingIndex}
                  className="relative border-b border-gray-100"
                  style={{ height: CELL_HEIGHT }}
                >
                  <div className="absolute inset-0 flex">
                    {dates.map((date, dateIndex) => {
                      const d = dayjs(date);
                      const isToday = d.isSame(today, 'day');
                      const isWeekend = d.day() === 0 || d.day() === 6;
                      const loaded = isDateLoaded(date);
                      
                      return (
                        <div
                          key={dateIndex}
                          className={cn(
                            'border-r border-gray-100',
                            isWeekend && 'bg-gray-50/50',
                            isToday && 'bg-blue-50/30',
                            !loaded && isLoading && 'bg-gray-100 animate-pulse'
                          )}
                          style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                        />
                      );
                    })}
                  </div>

                  {listingBookings.map((booking) => {
                    const pos = getBookingPosition(booking);
                    if (pos.width <= 0) return null;
                    
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick?.(booking.id);
                        }}
                        className={cn(
                          'absolute top-1 bottom-1 rounded-md cursor-pointer transition-all hover:brightness-110 hover:z-10 shadow-sm overflow-hidden',
                          statusColors[booking.status] || 'bg-gray-500',
                          pos.isPartialStart && 'rounded-l-none',
                          pos.isPartialEnd && 'rounded-r-none'
                        )}
                        style={{
                          left: pos.left + 2,
                          width: pos.width,
                        }}
                        title={`${booking.userName || 'Guest'} (${booking.status})`}
                      >
                        <div className="px-2 py-1 text-white text-xs font-medium truncate">
                          {booking.userName || booking.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg px-3 py-2 flex items-center gap-2 text-sm text-gray-600 z-20">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Loading...
        </div>
      )}
    </div>
  );
};

export default BookingCalendar;
