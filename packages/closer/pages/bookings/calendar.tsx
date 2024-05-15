import Head from 'next/head';

import { useEffect, useState } from 'react';
import Timeline, {
  CustomMarker,
  DateHeader,
  SidebarHeader,
  TimelineHeaders,
} from 'react-calendar-timeline';

import { ErrorMessage, Spinner } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import dayjs from 'dayjs';

import PageNotFound from '../404';
import { MAX_BOOKINGS_TO_FETCH, MAX_USERS_TO_FETCH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { useDebounce } from '../../hooks/useDebounce';
import {
  formatListings,
  generateBookingItems,
  getBookingsWithUserAndListing,
  getFilterAccommodationUnits,
} from '../../utils/booking.helpers';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const loadTime = Date.now();

const BookingsCalendarPage = () => {
  const { enabledConfigs, TIME_ZONE } = useConfig();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const defaultTimeStart = dayjs().startOf('day').toDate();
  const defaultTimeEnd = dayjs().startOf('day').add(14, 'day').toDate();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const sixHours = 6 * 60 * 60 * 1000;
  const oneMonth = 30 * dayAsMs;
  const defaultAccommodationUnits = [{ title: __('bookings_no_bookings') }];

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
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });
  const formattedListings = listings && formatListings(listings.toJS());

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

  useEffect(() => {
    if (filteredAccommodationUnits && filteredAccommodationUnits.length > 0) {
      if (
        JSON.stringify(filteredAccommodationUnits) !==
        JSON.stringify(lastNonEmptyUnits)
      ) {
        setLastNonEmptyUnits(filteredAccommodationUnits);
      }
    }
  }, [filteredAccommodationUnits, lastNonEmptyUnits]);

  useEffect(() => {
    if (bookingItems && bookingItems.length > 0) {
      if (
        JSON.stringify(bookingItems) !==
        JSON.stringify(lastNonEmptyBookingItems)
      ) {
        setLastNonEmptyBookingItems(bookingItems);
      }
    }
  }, [bookingItems, lastNonEmptyBookingItems]);

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
    window.open(`/bookings/${itemId}`, '_blank');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        platform.booking.get(filter),
        platform.listing.get(),
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
        <title>{__('booking_calendar')}</title>
      </Head>

      <main className="flex flex-col gap-4">
        <Heading level={1}>{__('booking_calendar')}</Heading>

        <div className="min-h-[600px]">
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
            className="relative "
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
    </>
  );
};

export default BookingsCalendarPage;
