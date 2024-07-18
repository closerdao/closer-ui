import { useEffect, useMemo, useState } from 'react';

import { Card, Heading } from '../../components/ui';
import DonutChart from '../../components/ui/Charts/DonutChart';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';

import { MAX_BOOKINGS_TO_FETCH, MAX_LISTINGS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  getDateRange,
  getDuration,
  // getNumBookedNights,
  // getTotalNumNights,
} from '../../utils/dashboard.helpers';
import BookingsIcon from '../icons/BookingsIcon';
import ArrivingAndDeparting from './ArrivingAndDeparting';
import BookingsWithRoomInfo from './BookingsWithRoomInfo';
import OccupancyCard from './OccupancyCard';

dayjs.extend(utc);
dayjs.extend(timezone);

const now = Date.now();

const paidStatuses = ['paid', 'tokens-staked', 'credits-paid'];
const relevantStatuses = [
  ...paidStatuses,
  'pending',
  'confirmed',
  'checked-in',
  'checked-out',
];

interface Filter {
  where: { [key: string]: any };
  limit?: number;
  start?: DateRangeFilter;
}

interface DateRangeFilter {
  $lte?: Date;
  $gte?: Date;
}

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
  const [filter, setFilter] = useState<Filter | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const duration = getDuration(timeFrame, fromDate, toDate);

  // console.log('duration=', duration);

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

  const bookings = platform.booking.find(filter);
  const listings = platform.listing.find(listingFilter);
  const arrivingBookings = platform.booking.find(arrivingFilter);
  const departingBookings = platform.booking.find(departingFilter);

  console.log('=====================');
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

  

  const getOccupancyByListing = (
    nightlyListings: any,
    nightlyBookings: any,
    duration: number,
  ) => {
    // console.log('nightlyBookings=', nightlyBookings);
    const occupancyByListing = nightlyListings?.map((listing: any) => {
      
      const listingBookings = nightlyBookings?.filter(
        (booking: any) => booking.get('listing') === listing.get('_id'),
      );

      // console.log('listing=',listing.get('name'));

      // console.log('listingBookings=',listingBookings);
      // const numBookedNights = getNumBookedNights(listingBookings, listing);
      // const totalNumNights = getTotalNumNights(listing) * duration;
      // const occupancy = ((numBookedNights / totalNumNights) * 100).toFixed(1);
      // console.log('occupancy=', occupancy);
      // return { listing, occupancy };
    });

    // console.log('occupancyByListing=',nightlyListings && occupancyByListing);

    return 0;
  };

  const occupancyByListing =
    nightlyListings &&
    nightlyListings &&
    getOccupancyByListing(nightlyListings, nightlyBookings, duration);

  // console.log('occupancyByListing=', occupancyByListing);

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
        // console.log('adults=', booking.get('adults'));
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  const totalPeople = numGuests + numVolunteers + numTeam + numEventAttendees;

  // console.log('totalPeople-=', totalPeople);

  const numPendingApplications =
    bookings &&
    bookings.filter((booking: any) => booking.get('status') === 'pending').size;
  const numConfirmedApplications =
    bookings &&
    bookings.filter((booking: any) => booking.get('status') === 'confirmed')
      .size;

  const peopleData = [
    { name: 'Guests', value: numGuests },
    { name: 'Volunteers', value: numVolunteers },
    { name: 'Team', value: numTeam },
    { name: 'Event Attendees', value: numEventAttendees },
  ];

  const applicationsData = [
    { name: 'Confirmed', value: numConfirmedApplications },
    { name: 'Pending', value: numPendingApplications },
  ];

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        platform.booking.get(filter),
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
    if (filter) {
      loadData();
    }
  }, [filter]);

  useEffect(() => {
    const { start, end } = getDateRange({
      timeFrame,
      fromDate,
      toDate,
      timeZone: TIME_ZONE,
    });
    setStart(start);
    setEnd(end);
    // console.log('start=', start);
    // console.log('end=', end);

    setFilter({
      ...filter,
      where: {
        status: {
          $in: relevantStatuses,
        },
        $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
      },
    });
  }, [timeFrame, fromDate, toDate]);

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <Heading level={3} className="uppercase text-md flex gap-3">
        <BookingsIcon /> {t('dashboard_bookings_title')}
      </Heading>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <OccupancyCard
            isNightly={true}
            listings={listings}
            nightlyListings={nightlyListings}
            bookings={bookings}
            nightlyBookings={nightlyBookings}
            duration={duration}
            start={start}
            end={end}
          />
          {(timeFrame === 'today' || duration === 1) && (
            <ArrivingAndDeparting
              arrivingBookings={arrivingBookings}
              departingBookings={departingBookings}
              nightlyListings={nightlyListings}
              nightlyListingsIds={nightlyListingsIds}
            />
          )}
          {!(timeFrame === 'today' && duration === 1) && (
            <Card className="p-2 flex flex-col gap-1 ">

              ddd
            </Card>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <OccupancyCard
            isNightly={false}
            listings={listings}
            nightlyListings={nightlyListings}
            bookings={bookings}
            nightlyBookings={nightlyBookings}
            duration={duration}
            start={start}
            end={end}
          />
          {/* <BookingsWithRoomInfo
            bookings={bookings}
            listings={listings}
            TIME_ZONE={TIME_ZONE}
          /> */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_applications')}
          </Heading>
          <DonutChart data={applicationsData} />
        </Card>

        <Card className="p-2 gap-2">
          <Heading level={3} className="uppercase text-sm">
            {t('dashboard_people')}
          </Heading>
          <DonutChart data={peopleData} />
        </Card>
      </div>
    </section>
  );
};

export default DashboardBookings;
