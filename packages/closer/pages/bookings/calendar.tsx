import Head from 'next/head';

import { useEffect, useRef, useState } from 'react';
import Timeline, {
  CustomMarker,
  DateHeader,
  SidebarHeader,
  TimelineHeaders,
} from 'react-calendar-timeline';

import AdminLayout from '../../components/Dashboard/AdminLayout';
import SpaceHostBooking from '../../components/SpaceHostBooking';
import Switch from '../../components/Switch';
import { ErrorMessage, Spinner } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  MAX_USERS_TO_FETCH,
} from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { useDebounce } from '../../hooks/useDebounce';
import { BookingConfig, Listing } from '../../types';
import api from '../../utils/api';
import {
  formatListings,
  generateBookingItems,
  getBookingsWithUserAndListing,
  getFilterAccommodationUnits,
} from '../../utils/booking.helpers';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const loadTime = Date.now();

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

  const defaultTimeStart = dayjs().startOf('day').toDate();
  const defaultTimeEnd = dayjs().startOf('day').add(14, 'day').toDate();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const sixHours = 6 * 60 * 60 * 1000;
  const oneMonth = 30 * dayAsMs;
  const defaultAccommodationUnits = [{ title: t('bookings_no_bookings') }];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [lastNonEmptyUnits, setLastNonEmptyUnits] = useState(
    defaultAccommodationUnits,
  );
  const [lastNonEmptyBookingItems, setLastNonEmptyBookingItems] = useState([]);

  const [visibleRange, setVisibleRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(loadTime),
    end: defaultTimeEnd,
  });

  const [showListingsWithBookings, setShowListingsWithBookings] =
    useState(false);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const debouncedVisibleRange = useDebounce(visibleRange, 500);

  const filter = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      $and: [
        { start: { $lte: new Date(debouncedVisibleRange.end) } },
        { end: { $gte: new Date(debouncedVisibleRange.start) } },
      ],
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find({
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  });

  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });
  const formattedListings = listings && formatListings(listings.toJS());
  const listingOptions = listings?.toJS().map((listing: Listing) => ({
    value: listing._id,
    label: listing.name,
  }));

  const bookingsWithUserAndListing = getBookingsWithUserAndListing({
    bookings,
    listings,
    allUsers,
    TIME_ZONE,
    browserTimezone,
  });

  const accommodationUnits =
    formattedListings &&
    formattedListings.map((listing: any, index: number) => {
      return {
        id: index + 1,
        title: listing.name,
        listingId: listing.id,
      };
    });

  const bookingItems =
    accommodationUnits &&
    generateBookingItems(bookingsWithUserAndListing, accommodationUnits);

  const groupsWithBookings = bookingItems && [
    ...new Set(bookingItems.map((item: any) => item.group)),
  ];

  const filteredAccommodationUnits =
    groupsWithBookings &&
    getFilterAccommodationUnits(accommodationUnits, groupsWithBookings);

  useEffect(() => {
    loadData();
  }, [debouncedVisibleRange]);

  const prevFilteredAccommodationUnits = useRef(null);
  const prevBookingItems = useRef(null);

  useEffect(() => {
    if (showListingsWithBookings) {
      if (
        JSON.stringify(filteredAccommodationUnits) !==
        JSON.stringify(prevFilteredAccommodationUnits.current)
      ) {
        setLastNonEmptyUnits(
          filteredAccommodationUnits || defaultAccommodationUnits,
        );
        prevFilteredAccommodationUnits.current = filteredAccommodationUnits;
      }
    } else {
      if (
        JSON.stringify(accommodationUnits) !==
        JSON.stringify(prevFilteredAccommodationUnits.current)
      ) {
        setLastNonEmptyUnits(accommodationUnits || defaultAccommodationUnits);
        prevFilteredAccommodationUnits.current = accommodationUnits;
      }
    }
  }, [
    showListingsWithBookings,
    filteredAccommodationUnits,
    accommodationUnits,
  ]);

  useEffect(() => {
    if (
      JSON.stringify(bookingItems) !== JSON.stringify(prevBookingItems.current)
    ) {
      setLastNonEmptyBookingItems(bookingItems || []);
      prevBookingItems.current = bookingItems;
    }
  }, [bookingItems]);

  const handleSelectedRangeChange = (
    visibleTimeStart: number,
    visibleTimeEnd: number,
    updateScrollCanvas: (start: number, end: number) => void,
  ) => {
    setVisibleRange({
      start: new Date(visibleTimeStart),
      end: new Date(visibleTimeEnd),
    });

    updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
  };

  const handleBookingClick = (itemId: string) => {
    // react-calendar-timeline library uses itemId's for keys. We add index to itemId to have a unique key, and have to remove it here.
    if (itemId.length > 24) {
      itemId = itemId.substring(0, 24);
    }
    window.open(`/bookings/${itemId}`, '_blank');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get({ where: {}, limit: MAX_LISTINGS_TO_FETCH }),
        platform.user.get({ limit: MAX_USERS_TO_FETCH }),
      ]);
    } catch (err: any) {
      console.log('Error loading data...', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

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

          <section className="mt-10 flex flex-col gap-8">
            <SpaceHostBooking listingOptions={listings && listingOptions} />
            <Switch
              disabled={false}
              name="showListingsWithBookings"
              label="Only show listings with bookings"
              onChange={setShowListingsWithBookings}
              checked={showListingsWithBookings}
            />
          </section>

          <div className="min-h-[600px] w-full">
            <Timeline
              sidebarWidth={220}
              groups={(lastNonEmptyUnits || defaultAccommodationUnits).map(
                (unit, index) => ({
                  id: index.toString(),
                  ...unit,
                }),
              )}
              items={lastNonEmptyBookingItems || []}
              defaultTimeStart={defaultTimeStart}
              defaultTimeEnd={defaultTimeEnd}
              onItemSelect={handleBookingClick}
              onTimeChange={handleSelectedRangeChange}
              minZoom={sixHours}
              maxZoom={oneMonth}
              className="relative"
            >
              <TimelineHeaders className="sticky">
                {loading && (
                  <div className="px-4 w-[200px] flex gap-2 items-center absolute h-[30px] bottom-[-30px] left-0   bg-white z-10">
                    <Spinner /> Updating...
                  </div>
                )}
                <SidebarHeader>
                  {({ getRootProps }) => {
                    return <div {...getRootProps()}>Listing/bed</div>;
                  }}
                </SidebarHeader>
                <DateHeader unit="primaryHeader" />
                <DateHeader height={44} />
              </TimelineHeaders>

              <CustomMarker date={Math.floor(new Date().getTime() / 1000)}>
                {({ styles }) => {
                  const customStyles = {
                    ...styles,
                    backgroundColor: 'deeppink',
                    width: '3px',
                  };
                  return <div style={customStyles} />;
                }}
              </CustomMarker>
            </Timeline>
            {error && <ErrorMessage error={parseMessageFromError(error)} />}
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
