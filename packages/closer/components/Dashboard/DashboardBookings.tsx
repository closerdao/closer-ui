import { useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { Card, Heading, Spinner } from '../../components/ui';
import DonutChart from '../../components/ui/Charts/DonutChart';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';

import {
  MAX_BOOKINGS_TO_FETCH,
  MAX_LISTINGS_TO_FETCH,
  dashboardRelevantStatuses,
  paidStatuses,
} from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { Filter } from '../../types';
import {
  getBookedNights,
  getBookedSpaceSlots,
  getDateRange,
  getDuration,
} from '../../utils/dashboard.helpers';
import BookingsIcon from '../icons/BookingsIcon';
import OccupancyByListing from './OccupancyByListing';
import OccupancyCard from './OccupancyCard';

dayjs.extend(utc);
dayjs.extend(timezone);

const now = Date.now();

interface Props {
  timeFrame: string;
  fromDate: Date | string;
  toDate: Date | string;
}

const DashboardBookings = ({ timeFrame, fromDate, toDate }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { TIME_ZONE } = useConfig();

  const [isLoading, setIsLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<Filter | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const listingFilter = {
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  };

  const dayAsMs = 24 * 60 * 60 * 1000;
  const threeDaysAgo = new Date(now - 3 * dayAsMs);
  const inSevenDays = new Date(now + 7 * dayAsMs);

  const arrivingFilter = {
    where: {
      status: { $in: paidStatuses },
      start: { $lte: inSevenDays },
      end: { $gte: now },
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const departingFilter = {
    where: {
      status: { $in: [...paidStatuses, 'checked-in', 'checked-out'] },
      start: { $gte: now },
      end: { $gte: threeDaysAgo },
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };

  const bookings = platform.booking.find(bookingFilter);
  const listings = platform.listing.find(listingFilter);
  const arrivingBookings = platform.booking.find(arrivingFilter);
  const departingBookings = platform.booking.find(departingFilter);

  const firstBooking =
    bookings &&
    bookings.find((booking: any) => {
      return paidStatuses.includes(booking.get('status'));
    });

  const firstBookingDate = firstBooking && firstBooking.get('start');

  const duration = getDuration(
    timeFrame,
    timeFrame === 'allTime' ? new Date(firstBookingDate) : fromDate,
    toDate,
  );

  const nightlyListings = useMemo(
    () =>
      listings?.filter(
        (listing: any) =>
          !listing.get('priceDuration') ||
          listing.get('priceDuration') === 'night',
      ),
    [listings],
  );

  const nightlyListingsIds =
    nightlyListings &&
    nightlyListings.map((listing: any) => listing.get('_id'));

  const nightlyBookings =
    bookings &&
    nightlyListings &&
    bookings.filter((booking: any) => {
      return nightlyListingsIds.includes(booking.get('listing'));
    });

  const { bookedNights, numBookedNights } = getBookedNights({
    nightlyBookings,
    nightlyListings,
    start,
    end,
    duration,
    TIME_ZONE,
    firstBookingDate: timeFrame === 'allTime' ? firstBookingDate : undefined,
  });

  const spaceListings =
    listings &&
    listings.filter((listing: any) => listing.get('priceDuration') !== 'night');

  const spaceListingsIds =
    spaceListings && spaceListings.map((listing: any) => listing.get('_id'));

  const spaceBookings =
    bookings &&
    spaceListings &&
    bookings.filter((booking: any) => {
      return spaceListingsIds.includes(booking.get('listing'));
    });

  const { bookedSpaceSlots, numBookedSpaceSlots } = getBookedSpaceSlots(
    spaceBookings,
    spaceListings,
    duration,
  );

  const getPeopleCount = (bookings: any, fieldToCheck: string) => {
    return (
      bookings &&
      bookings.reduce((sum: number, booking: any) => {
        if (
          booking.get(fieldToCheck) &&
          paidStatuses.includes(booking.get('status'))
        ) {
          return sum + booking.get('adults');
        }
        return sum;
      }, 0)
    );
  };

  const numVolunteers = getPeopleCount(bookings, 'volunteerId') || 0;

  const numEventAttendees = getPeopleCount(bookings, 'eventId') || 0;
  const numTeam = getPeopleCount(bookings, 'isTeamBooking') || 0;

  const numGuests =
    bookings &&
    bookings.reduce((sum: number, booking: any) => {
      if (
        !booking.get('volunteerId') &&
        !booking.get('eventId') &&
        !booking.get('isTeamBooking') &&
        paidStatuses.includes(booking.get('status'))
      ) {
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  const numPendingBookings =
    bookings &&
    bookings.filter((booking: any) => booking.get('status') === 'pending').size;
  const numConfirmedBookings =
    bookings &&
    bookings.filter((booking: any) => booking.get('status') === 'confirmed')
      .size;
  const numPaidBookings =
    bookings &&
    bookings.filter((booking: any) =>
      paidStatuses.includes(booking.get('status')),
    ).size;

  const peopleData = [
    { name: 'Guests', value: numGuests },
    { name: 'Volunteers', value: numVolunteers },
    { name: 'Team', value: numTeam },
    { name: 'Event Attendees', value: numEventAttendees },
  ];

  const applicationsData = [
    { name: 'Confirmed', value: numConfirmedBookings },
    { name: 'Pending', value: numPendingBookings },
    { name: 'Paid', value: numPaidBookings },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.booking.get(bookingFilter),
        platform.booking.get(arrivingFilter),
        platform.booking.get(departingFilter),
        platform.listing.get(listingFilter),
      ]);
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (bookingFilter) {
      loadData();
    }
  }, [bookingFilter]);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });

    setStart(start);
    setEnd(end);

    if (timeFrame === 'allTime') {
      setBookingFilter({
        where: {
          status: {
            $in: dashboardRelevantStatuses,
          },
        },
        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    } else {
      setBookingFilter({
        where: {
          status: {
            $in: dashboardRelevantStatuses,
          },
          $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
        },

        sort_by: 'start',
        limit: MAX_BOOKINGS_TO_FETCH,
      });
    }
  }, [timeFrame, fromDate, toDate]);

  return (
    <section className="bg-white rounded-md px-0 sm:px-6 py-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <BookingsIcon /> {t('dashboard_bookings_title')}
      </Heading>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OccupancyCard
            isNightly={true}
            listings={listings}
            duration={duration}
            nightlyListings={nightlyListings}
            spaceListings={spaceListings}
            numBookedNights={numBookedNights}
            arrivingBookings={arrivingBookings}
            departingBookings={departingBookings}
            nightlyListingsIds={nightlyListingsIds}
            timeFrame={timeFrame}
          />

          <OccupancyByListing
            bookedNights={bookedNights}
            bookedSpaceSlots={bookedSpaceSlots}
            isNightly={true}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {spaceListings && spaceListings.size > 100 ? (
            <>
              {' '}
              <OccupancyCard
                isNightly={false}
                listings={listings}
                nightlyListings={nightlyListings}
                spaceListings={spaceListings}
                duration={duration}
                numBookedSpaceSlots={numBookedSpaceSlots}
              />
              <OccupancyByListing
                bookedNights={bookedNights}
                bookedSpaceSlots={bookedSpaceSlots}
                isNightly={false}
              />
            </>
          ) : (
            'No space listings'
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_bookings')}
          </Heading>
          <div
            className={`${
              isMobile ? 'h-[280px]' : 'h-[220px]'
            } overflow-hidden`}
          >
            {isLoading ? <Spinner /> : <DonutChart data={applicationsData} />}
          </div>
        </Card>

        <Card className="p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_people')}
          </Heading>
          <div
            className={`${
              isMobile ? 'h-[280px]' : 'h-[220px]'
            }  overflow-hidden`}
          >
            {isLoading ? <Spinner /> : <DonutChart data={peopleData} />}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default DashboardBookings;
