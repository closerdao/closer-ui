import Head from 'next/head';

import { useEffect, useState } from 'react';
import Timeline, {
  CustomMarker,
  DateHeader,
  SidebarHeader,
  TimelineHeaders,
} from 'react-calendar-timeline';

import { Spinner } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import PageNotFound from '../404';
import { MAX_USERS_TO_FETCH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  formatListings,
  generateBookingItems,
  getBookingsWithUserAndListing,
  getFilterAccommodationUnits,
} from '../../utils/booking.helpers';
import { __ } from '../../utils/helpers';

dayjs.extend(utc);
dayjs.extend(timezone);

const loadTime = Date.now();

const BookingsCalendarPage = () => {
  const { enabledConfigs } = useConfig();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

  const defaultTimeStart = dayjs().startOf('day').toDate();
  const defaultTimeEnd = dayjs().startOf('day').add(14, 'day').toDate();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const monthAgo = new Date(loadTime - 30 * dayAsMs);
  const sixHours = 6 * 60 * 60 * 1000;
  const oneMonth = 30 * dayAsMs;

  const filter = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      end: { $gte: monthAgo },
    },
  };

  const [loading, setLoading] = useState(false);
  const [visibleRange, setVisibleRange] = useState<{
    start: dayjs.Dayjs;
    end: dayjs.Dayjs;
  }>({
    start: dayjs(),
    end: dayjs(),
  });

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find();
  const allUsers = platform.user.find({ limit: MAX_USERS_TO_FETCH });
  const formattedListings = listings && formatListings(listings.toJS());

  const bookingsWithUserAndListing = getBookingsWithUserAndListing(
    bookings,
    listings,
    allUsers,
  );

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
  }, []);

  const handleSelectedRangeChange = (
    visibleTimeStart: number,
    visibleTimeEnd: number,
    updateScrollCanvas: (start: number, end: number) => void,
  ) => {
    // TODO: update filter based on visibleTimeStart and visibleTimeEnd. This requires compound queries support
    setVisibleRange({
      start: dayjs(visibleTimeStart),
      end: dayjs(visibleTimeEnd),
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
    } catch (err) {
      console.log('Error loading data...', err);
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
        {loading ? (
          <Spinner />
        ) : (
          <div className="">
            <Timeline
              sidebarWidth={220}
              groups={filteredAccommodationUnits || []}
              items={bookingItems || []}
              defaultTimeStart={defaultTimeStart}
              defaultTimeEnd={defaultTimeEnd}
              onItemSelect={handleBookingClick}
              onTimeChange={handleSelectedRangeChange}
              minZoom={sixHours}
              maxZoom={oneMonth}
            >
              <TimelineHeaders className="sticky">
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
          </div>
        )}
      </main>
    </>
  );
};

export default BookingsCalendarPage;
