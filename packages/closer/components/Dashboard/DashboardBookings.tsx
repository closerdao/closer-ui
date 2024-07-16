import { useEffect, useState } from 'react';

import ArrivingIcon from '../../components/icons/ArrivingIcon';
import DepartingIcon from '../../components/icons/DepartingIcon';
import { Card, Heading } from '../../components/ui';
import DonutChart from '../../components/ui/Charts/DonutChart';

import { useTranslations } from 'next-intl';

import { MAX_BOOKINGS_TO_FETCH, MAX_LISTINGS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { getDateRange } from '../../utils/dashboard.helpers';
import BookingsIcon from '../icons/BookingsIcon';
import OccupancyCard from './OccupancyCard';

const now = Date.now();

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

  const paidStatuses = ['paid', 'tokens-staked', 'credits-paid'];
  const relevantStatuses = [
    ...paidStatuses,
    'pending',
    'confirmed',
    'checked-in',
    'checked-out',
  ];

  const [isLoading, setIsLoading] = useState(false);

  const [filter, setFilter] = useState<Filter>({
    where: {},
    limit: MAX_BOOKINGS_TO_FETCH,
  });
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
  const nightlyListings =
    listings &&
    listings.filter(
      (listing: any) =>
        !listing.get('priceDuration') ||
        listing.get('priceDuration') === 'night',
    );

  const nightlyListingsIds =
    nightlyListings &&
    nightlyListings.map((listing: any) => listing.get('_id'));

  const arrivingNightlyBookings =
    arrivingBookings &&
    nightlyListings &&
    arrivingBookings?.filter((booking: any) => {
      {
        return nightlyListingsIds.includes(booking.get('listing'));
      }
    });
  const departingNightlyBookings =
    departingBookings &&
    nightlyListings &&
    departingBookings?.filter((booking: any) => {
      {
        return nightlyListingsIds.includes(booking.get('listing'));
      }
    });

  const nightlyBookings =
    bookings &&
    nightlyListings &&
    bookings.filter((booking: any) => {
      return nightlyListingsIds.includes(booking.get('listing'));
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

  console.log('numVolunteers=', numVolunteers);

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
    const { start, end } = getDateRange(timeFrame, fromDate, toDate);
    if (!toDate && !fromDate) {
      setFilter({
        ...filter,
        where: {
          status: {
            $in: relevantStatuses,
          },
          $and: [{ start: { $lte: end } }, { end: { $gte: start } }],
        },
      });
    }
    if (fromDate && toDate) {
      setFilter({
        ...filter,
        where: {
          status: { $in: paidStatuses },
          $and: [{ start: { $lte: toDate } }, { end: { $gte: fromDate } }],
        },
      });
    }
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
            spaceBookings={spaceBookings}
            nightlyBookings={nightlyBookings}
            spaceListings={spaceListings}
          />
          <div className="grid grid-rows-2 gap-4">
            <Card className="p-2 flex flex-row gap-1 justify-between items-center">
              <p className="text-xl font-bold">
                {arrivingNightlyBookings && arrivingNightlyBookings.size}
              </p>
              <div>
                <p>{t('dashboard_rooms')}</p>
                <p className="text-accent">{t('dashboard_arriving')}</p>
              </div>

              <div className="flex-shrink-0 bg-neutral-dark rounded-md w-9 h-9 flex items-center justify-center">
                <ArrivingIcon />
              </div>
            </Card>

            <Card className="p-2 flex flex-row gap-1 justify-between items-center">
              <p className="text-xl font-bold">
                {departingNightlyBookings && departingNightlyBookings.size}
              </p>
              <div>
                <p>{t('dashboard_rooms')}</p>
                <p className="text-accent">{t('dashboard_departing')}</p>
              </div>

              <div className="flex-shrink-0 bg-neutral-dark rounded-md w-9 h-9 flex items-center justify-center">
                <DepartingIcon />
              </div>
            </Card>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <OccupancyCard
            isNightly={false}
            listings={listings}
            nightlyListings={nightlyListings}
            spaceBookings={spaceBookings}
            nightlyBookings={nightlyBookings}
            spaceListings={spaceListings}
          />
          <Card className="p-2 gap-2">
            <p>
              Room 1 <span className="text-neon-dark">night</span>
            </p>
            <p>
              Room 3 <span className="text-neon-dark">night</span>
            </p>
            <p>
              Meeting Room on the first floor 1{' '}
              <span className="text-neon-dark">14:00 - 16:00</span>
            </p>
            <p>
              Room 1 <span className="text-neon-dark">night</span>
            </p>
          </Card>
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
