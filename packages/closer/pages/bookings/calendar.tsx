import Head from 'next/head';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import BookingActionsDropdown from '../../components/BookingActionsDropdown';
import BookingCalendar from '../../components/BookingCalendar';
import { ErrorMessage } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  MAX_USERS_TO_FETCH,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { BookingConfig, Listing } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const BookingsCalendarPage = ({
  bookingConfig,
}: {
  bookingConfig: BookingConfig;
}) => {
  const t = useTranslations();
  const { enabledConfigs, TIME_ZONE } = useConfig();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const [loadedRange, setLoadedRange] = useState<{ start: Date; end: Date }>({
    start: dayjs().subtract(7, 'day').startOf('day').toDate(),
    end: dayjs().add(60, 'day').startOf('day').toDate(),
  });

  const filter = useMemo(() => ({
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      $and: [
        { start: { $lte: loadedRange.end } },
        { end: { $gte: loadedRange.start } },
      ],
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  }), [loadedRange]);

  const bookingsData = platform.booking.find(filter);
  const listingsData = platform.listing.find({
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  });
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });

  const listings = useMemo(() => {
    if (!listingsData) return [];
    
    const formatted: { id: string; name: string; listingId: string }[] = [];
    let index = 0;
    
    listingsData.toJS().forEach((listing: Listing) => {
      if (listing.private) {
        for (let i = 0; i < listing.quantity; i++) {
          formatted.push({
            id: `${index}`,
            name: listing.quantity > 1 ? `${listing.name} ${i + 1}` : listing.name,
            listingId: listing._id,
          });
          index++;
        }
      } else {
        for (let i = 0; i < listing.quantity; i++) {
          for (let j = 0; j < listing.beds; j++) {
            formatted.push({
              id: `${index}`,
              name: `${listing.name} bed ${i * listing.beds + j + 1}`,
              listingId: listing._id,
            });
            index++;
          }
        }
      }
    });
    
    return formatted;
  }, [listingsData]);

  const bookings = useMemo(() => {
    if (!bookingsData || !allUsers || !listings.length) return [];
    
    const usersMap = new Map();
    allUsers.toJS().forEach((u: any) => {
      usersMap.set(u._id, u);
    });

    const listingUnitsMap = new Map<string, { id: string; index: number }[]>();
    listings.forEach((l, idx) => {
      if (!listingUnitsMap.has(l.listingId)) {
        listingUnitsMap.set(l.listingId, []);
      }
      listingUnitsMap.get(l.listingId)!.push({ id: l.id, index: idx });
    });

    const unitAssignments = new Map<string, number>();
    
    const result: any[] = [];
    
    bookingsData.toJS().forEach((booking: any) => {
      const user = usersMap.get(booking.createdBy);
      const listingId = booking.listing;
      const units = listingUnitsMap.get(listingId);
      
      if (!units || units.length === 0) return;

      const roomOrBedNumbers = booking.roomOrBedNumbers;
      
      if (Array.isArray(roomOrBedNumbers) && roomOrBedNumbers.length > 0) {
        roomOrBedNumbers.forEach((bedNum: number, i: number) => {
          const unitIndex = bedNum - 1;
          if (unitIndex >= 0 && unitIndex < units.length) {
            result.push({
              id: `${booking._id}-${i}`,
              start: new Date(booking.start),
              end: new Date(booking.end),
              title: booking.name || 'Booking',
              status: booking.status,
              listingId: units[unitIndex].id,
              userName: user?.screenname || user?.email || 'Guest',
            });
          }
        });
      } else {
        const assignmentKey = `${listingId}-${booking.start}`;
        const lastAssigned = unitAssignments.get(listingId) ?? -1;
        const nextUnit = (lastAssigned + 1) % units.length;
        unitAssignments.set(listingId, nextUnit);
        
        result.push({
          id: booking._id,
          start: new Date(booking.start),
          end: new Date(booking.end),
          title: booking.name || 'Booking',
          status: booking.status,
          listingId: units[nextUnit].id,
          userName: user?.screenname || user?.email || 'Guest',
        });
      }
    });
    
    return result;
  }, [bookingsData, allUsers, listings]);

  const listingOptions = useMemo(() => {
    if (!listingsData) return [];
    return listingsData.toJS().map((listing: Listing) => ({
      value: listing._id,
      label: listing.name,
    }));
  }, [listingsData]);

  const loadData = useCallback(async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const newFilter = {
        where: {
          status: { $in: ['paid', 'checked-in', 'checked-out'] },
          $and: [
            { start: { $lte: end } },
            { end: { $gte: start } },
          ],
        },
        limit: MAX_BOOKINGS_TO_FETCH,
      };
      
      await Promise.all([
        platform.booking.get(newFilter),
        platform.listing.get({ where: {}, limit: MAX_LISTINGS_TO_FETCH }),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
      ]);
      
      setLoadedRange({ start, end });
    } catch (err: any) {
      console.error('Error loading calendar data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    loadData(loadedRange.start, loadedRange.end);
  }, []);

  const handleDateRangeChange = useCallback((start: Date, end: Date) => {
    const needsLoad = 
      dayjs(start).isBefore(loadedRange.start) || 
      dayjs(end).isAfter(loadedRange.end);
    
    if (needsLoad) {
      const newStart = dayjs(start).isBefore(loadedRange.start) 
        ? start 
        : loadedRange.start;
      const newEnd = dayjs(end).isAfter(loadedRange.end) 
        ? end 
        : loadedRange.end;
      loadData(newStart, newEnd);
    }
  }, [loadedRange, loadData]);

  const handleBookingClick = useCallback((bookingId: string) => {
    const cleanId = bookingId.includes('-') ? bookingId.split('-')[0] : bookingId;
    window.open(`/bookings/${cleanId}`, '_blank');
  }, []);

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound error="User may not access" />;
  }

  if (
    process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true' ||
    (enabledConfigs && !enabledConfigs.includes('booking'))
  ) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('booking_calendar')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <main className="flex flex-col w-full">
          <Heading level={1}>{t('booking_calendar')}</Heading>

          <section className="mt-6 flex items-center justify-end">
            <BookingActionsDropdown
              listingOptions={listingOptions}
              showCreateBooking={true}
            />
          </section>

          <div className="mt-6 relative" style={{ minHeight: '500px' }}>
            <BookingCalendar
              listings={listings}
              bookings={bookings}
              isLoading={loading}
              loadedRange={loadedRange}
              onDateRangeChange={handleDateRangeChange}
              onBookingClick={handleBookingClick}
            />
            
            {error && (
              <div className="mt-4">
                <ErrorMessage error={parseMessageFromError(error)} />
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span>Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span>Checked in</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span>Checked out</span>
            </div>
          </div>
        </main>
      </AdminLayout>
    </>
  );
};

BookingsCalendarPage.getInitialProps = async (context: any) => {
  try {
    const [bookingRes, messages] = await Promise.all([
      api.get('/config/booking').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const bookingConfig = bookingRes?.data?.results?.value;
    return {
      bookingConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      bookingConfig: null,
      messages: null,
    };
  }
};

export default BookingsCalendarPage;
