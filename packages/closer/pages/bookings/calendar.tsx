/**
 * PLATFORM CONTEXT DOCUMENTATION
 * 
 * The platform context provides a unified interface for data access across the application.
 * It handles caching, API calls, and data transformation automatically.
 * 
 * USAGE PATTERNS:
 * 
 * 1. LOADING DATA (platform.{entity}.get):
 *    - Loads data from API and caches it
 *    - Returns a Promise that resolves when data is loaded
 *    - Use for initial data loading in useEffect or async functions
 *    - Example: await platform.booking.get(filter)
 * 
 * 2. ACCESSING CACHED DATA (platform.{entity}.find):
 *    - Returns cached data as Immutable.js objects
 *    - Use for reactive data access in render functions
 *    - Data is automatically updated when new data is loaded
 *    - Example: const bookings = platform.booking.find(filter)
 * 
 * 3. FINDING SINGLE ITEMS (platform.{entity}.findOne):
 *    - Finds a single item by ID from cached data
 *    - Returns the item object or undefined if not found
 *    - Use for getting specific items in render functions
 *    - Example: const user = platform.user.findOne(userId)
 * 
 * 4. BULK LOADING PATTERN:
 *    - First load all items: await platform.{entity}.get({ where: { _id: { $in: ids } } })
 *    - Then access individual items: platform.{entity}.findOne(id)
 *    - This pattern is efficient for loading related data
 * 
 * 5. FILTER CONSISTENCY:
 *    - Use identical filter objects for .get() and .find() calls
 *    - Platform uses filter as cache key, so consistency is crucial
 *    - Example: const filter = { where: { status: 'active' } }
 *              await platform.booking.get(filter)
 *              const bookings = platform.booking.find(filter)
 * 
 * 6. IMMUTABLE.JS HANDLING:
 *    - .find() returns Immutable.js objects
 *    - Use .toJS() to convert to plain JavaScript objects
 *    - Use .get() to access properties: item.get('property')
 *    - Use .size to check length: items.size
 * 
 * 7. ERROR HANDLING:
 *    - Platform methods can throw errors
 *    - Always wrap in try-catch blocks
 *    - Check for data existence before accessing properties
 * 
 * 8. REACTIVE UPDATES:
 *    - Components automatically re-render when platform data changes
 *    - No need to manually manage state for platform data
 *    - Platform handles all data synchronization
 */

import Head from 'next/head';

import { useEffect, useState } from 'react';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import SpaceHostBooking from '../../components/SpaceHostBooking';
import { ErrorMessage, Spinner } from '../../components/ui';
import Heading from '../../components/ui/Heading';
import Button from '../../components/ui/Button';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { BookingConfig, Listing } from '../../types';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';
import api from '../../utils/api';

type ViewMode = 'month' | 'week';

const BookingsCalendarPage = ({ bookingConfig }: { bookingConfig: BookingConfig }) => {
  const t = useTranslations();
  const { enabledConfigs, TIME_ZONE } = useConfig();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(dayjs());

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Calculate date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'week') {
      return {
        start: currentDate.startOf('week').toDate(),
        end: currentDate.endOf('week').toDate(),
      };
    } else {
      return {
        start: currentDate.startOf('month').toDate(),
        end: currentDate.endOf('month').toDate(),
      };
    }
  };

  const dateRange = getDateRange();

  const filter = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      $and: [
        { start: { $lte: dateRange.end } },
        { end: { $gte: dateRange.start } },
      ],
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find({
    where: {},
  });

  const listingOptions = listings?.toJS().map((listing: Listing) => ({
    value: listing._id,
    label: listing.name,
  }));

  // Get raw data for processing
  const allBookings = bookings?.toJS() || [];
  const allListings = listings?.toJS() || [];

  // Helper functions
  const getBookingsForListing = (listingId: string) => {
    return allBookings.filter((booking: any) => booking.listing === listingId);
  };

  const getBookedSpacesForListing = (listingId: string) => {
    const listingBookings = getBookingsForListing(listingId);
    return listingBookings.reduce((total: number, booking: any) => {
      const adults = booking.adults || 0;
      const children = booking.children || 0;
      return total + adults + children;
    }, 0);
  };

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(currentDate.subtract(1, 'week'));
    } else {
      setCurrentDate(currentDate.subtract(1, 'month'));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(currentDate.add(1, 'week'));
    } else {
      setCurrentDate(currentDate.add(1, 'month'));
    }
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load bookings first
      const bookingsRes = await platform.booking.get(filter);
      const bookingsData = bookingsRes.results;
      
      // Load listings
      await platform.listing.get({ where: {} });
      
      // Load users for bookings using the specified approach
      if (bookingsData && bookingsData.size > 0) {
        const results = bookingsData.toJS();
        const userIds = [...new Set(results.map((booking: any) => booking.createdBy))];
        if (userIds.length > 0) {
          const res = await platform.user.get({ where: { _id: { $in: userIds } } });
        }
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.roles.includes('space-host')) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{t('booking_calendar')}</title>
      </Head>

      <AdminLayout isBookingEnabled={isBookingEnabled}>
        <main className="flex flex-col w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Heading level={1} className="text-2xl">{t('booking_calendar')}</Heading>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <SpaceHostBooking listingOptions={listingOptions} />
            </div>
          </div>

          {/* View Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setViewMode('month')}
              >
                M
              </Button>
              <Button
                variant={viewMode === 'week' ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setViewMode('week')}
              >
                W
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={handlePrevious}
                isEnabled={!loading}
              >
                ← Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleToday}
                isEnabled={!loading}
              >
                Today
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleNext}
                isEnabled={!loading}
              >
                Next →
              </Button>
            </div>
          </div>

          {/* Current Period Display */}
          <div className="text-center text-lg font-semibold text-gray-700 mb-6">
            {viewMode === 'month' 
              ? currentDate.format('MMMM YYYY')
              : `${currentDate.startOf('week').format('MMM D')} - ${currentDate.endOf('week').format('MMM D, YYYY')}`
            }
          </div>

          {/* Calendar View */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading && (
              <div className="flex items-center justify-center p-4 bg-gray-50">
                <Spinner />
                <span className="ml-2">Loading bookings...</span>
              </div>
            )}

            {error && (
              <div className="p-4">
                <ErrorMessage error={parseMessageFromError(error)} />
              </div>
            )}

            {!loading && !error && allListings && (
              <div className="p-4">
                {allListings.length > 0 ? (
                  <div className="space-y-4">
                    {allListings.map((listing: any) => {
                      const listingBookings = getBookingsForListing(listing._id);
                      const totalSpaces = listing.quantity || 0;
                      const bookedSpaces = getBookedSpacesForListing(listing._id);
                      const availableSpaces = totalSpaces - bookedSpaces;
                      
                      return (
                        <div key={listing._id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">{listing.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>{listingBookings.length} booking{listingBookings.length !== 1 ? 's' : ''}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                        {bookedSpaces}/{totalSpaces} spaces booked
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        availableSpaces > 0 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {availableSpaces} available
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">Capacity</div>
                                <div className="text-xs text-gray-400">{totalSpaces} total spaces</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {listingBookings.length > 0 ? (
                              <div className="space-y-2">
                                {listingBookings.map((booking: any) => {
                                  const startDate = dayjs(booking.start);
                                  const endDate = dayjs(booking.end);
                                  const user = platform.user.findOne(booking.createdBy);
                                  const userName = user?.screenname || 'Loading...';
                                  
                                  return (
                                    <div
                                      key={booking._id}
                                      className="p-3 border rounded-lg cursor-pointer hover:shadow-sm transition-all duration-200"
                                      onClick={() => window.open(`/bookings/${booking._id}`, '_blank')}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">
                                              {userName}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                              {booking.status}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {startDate.format('MMM D')} - {endDate.format('MMM D')}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <p className="text-sm">No bookings for this period</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg font-medium">No listings found</p>
                    <p className="text-sm">No listings available for management</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </AdminLayout>
    </>
  );
};

BookingsCalendarPage.getInitialProps = async (context: NextPageContext) => {
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
