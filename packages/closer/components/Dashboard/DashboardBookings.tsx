import { useEffect, useState } from 'react';

import ArrivingIcon from '../../components/icons/ArrivingIcon';
import DepartingIcon from '../../components/icons/DepartingIcon';
import HospitalityIcon from '../../components/icons/HospitalityIcon';
import SpacesIcon from '../../components/icons/SpacesIcon';
import { Card, Heading } from '../../components/ui';
import DonutChart from '../../components/ui/Charts/DonutChart';

import { useTranslations } from 'next-intl';

import { MAX_BOOKINGS_TO_FETCH, MAX_LISTINGS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import {
  getDateRange,
  getTotalNumListings,
} from '../../utils/dashboard.helpers';
import BookingsIcon from '../icons/BookingsIcon';
import TimeFrameSelector from './TimeFrameSelector';

interface Filter {
  where: {[key: string]: any};
  limit?: number;
  start?: DateRangeFilter;
}

interface DateRangeFilter {
  $lte?: Date;
  $gte?: Date;
}

// data needed for bookings section:
// bookings for date range
// Arriving and departing bookings
// all listings
// hourly + nightly bookings

const DashboardBookings = () => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const relevantStatuses = [
    'paid',
    'tokens-staked',
    'credits-paid',
    'pending',
    'confirmed',
    'checked-in',
    'checked-out',
  ];

  const [isLoading, setIsLoading] = useState(false);

  const [timeFrame, setTimeFrame] = useState('today');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({
    where: {},
    limit: MAX_BOOKINGS_TO_FETCH,
  });
  const listingFilter = {
    where: {},
    limit: MAX_LISTINGS_TO_FETCH,
  };

  const now = Date.now();
  const dayAsMs = 24 * 60 * 60 * 1000;
  const inThreeDays = new Date(now + 3 * dayAsMs);
  const inSevenDays = new Date(now + 7 * dayAsMs);

  const arrivingFilter  = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      start: { $lte: inSevenDays },
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };
  const departingFilter  = {
    where: {
      status: { $in: ['paid', 'checked-in', 'checked-out'] },
      end: { $gte: inThreeDays },
    },
    limit: MAX_BOOKINGS_TO_FETCH,
  };
  
  const bookings = platform.booking.find(filter);
  const arrivingBookings = platform.booking.find(arrivingFilter);
  const departingBookings = platform.booking.find(departingFilter);

  console.log('arrivingBookings=',arrivingBookings && arrivingBookings);
  console.log('departingBookings=',departingBookings && departingBookings);
  const listings = platform.listing.find(listingFilter);
  
  const nightlyListings = listings && listings.filter((listing: any) => !listing.get('priceDuration') ||  listing.get('priceDuration') === 'night').map((listing: any) => listing.get('_id'));
  const nightlyBookings = bookings && nightlyListings && bookings.filter((booking: any) => nightlyListings.includes(booking.get('listing'))); 

  console.log('nightlyBookings=', nightlyBookings && nightlyBookings.toJS());
  const totalNumListings = listings && getTotalNumListings(listings);

  console.log(
    'bookings=',
    bookings && bookings.toJS().map((booking: any) => booking.status),
  );

  const paidStatuses = ['paid', 'tokens-staked', 'credits-paid'];

  const numVolunteers =
    bookings &&
    bookings.reduce((sum: number, booking: any) => {
      if (
        booking.get('volunteerId') &&
        paidStatuses.includes(booking.get('status'))
      ) {
        console.log('adults=', booking.get('adults'));
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  console.log('numVolunteers=', numVolunteers);
  const numEventAttendees =
    bookings &&
    bookings.reduce((sum: number, booking: any) => {
      if (
        booking.get('eventId') &&
        paidStatuses.includes(booking.get('status'))
      ) {
        console.log('adults=', booking.get('adults'));
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  const numTeam =
    bookings &&
    bookings.reduce((sum: number, booking: any) => {
      if (
        booking.get('isTeamBooking') &&
        paidStatuses.includes(booking.get('status'))
      ) {
        console.log('adults=', booking.get('adults'));
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  const numGuests =
    bookings &&
    bookings.reduce((sum: number, booking: any) => {
      if (
        !booking.get('volunteerId') &&
        !booking.get('eventId') &&
        !booking.get('isTeamBooking') &&
        paidStatuses.includes(booking.get('status'))
      ) {
        console.log('adults=', booking.get('adults'));
        return sum + booking.get('adults');
      }
      return sum;
    }, 0);

  const totalPeople = numGuests + numVolunteers + numTeam + numEventAttendees;
  const hospitalityOccupancy = ((totalPeople / totalNumListings) * 100).toFixed(
    1,
  );
  console.log('totalPeople-=', totalPeople);

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
      <div className="flex justify-between">
        <Heading level={3} className="uppercase text-md flex gap-3">
          <BookingsIcon /> {t('dashboard_bookings_title')}
        </Heading>

        <TimeFrameSelector
          timeFrame={timeFrame}
          setTimeFrame={setTimeFrame}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-2 bg-neutral-light flex flex-col">
            <div className="flex gap-1 justify-between">
              <Heading level={3} className="uppercase text-sm text-accent">
                {t('dashboard_hospitality_occupancy')}
              </Heading>
              <div className="flex-shrink-0 bg-accent rounded-md w-9 h-9 flex items-center justify-center">
                <HospitalityIcon />
              </div>
            </div>

            <div className="flex gap-1 justify-between items-end text-sm">
              <div>
                <p className="text-2xl font-bold">{hospitalityOccupancy && `${hospitalityOccupancy}%`}</p>
                <p> {t('dashboard_booked')}</p>
              </div>
              <div>
                <span className="text-xl">{totalNumListings}</span>{' '}
                {t('dashboard_rooms')}
              </div>
            </div>
          </Card>
          <div className="grid grid-rows-2 gap-4">
            <Card className="p-2 flex flex-row gap-1 justify-between items-center">
              <p className="text-xl font-bold">9</p>
              <div>
                <p>{t('dashboard_rooms')}</p>
                <p className="text-accent">{t('dashboard_arriving')}</p>
              </div>

              <div className="flex-shrink-0 bg-neutral-dark rounded-md w-9 h-9 flex items-center justify-center">
                <ArrivingIcon />
              </div>
            </Card>

            <Card className="p-2 flex flex-row gap-1 justify-between items-center">
              <p className="text-xl font-bold">9</p>
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
          <Card className="p-2 bg-neutral-light flex flex-col">
            <div className="flex gap-1 justify-between">
              <Heading level={3} className="uppercase text-sm text-neon-dark">
                {t('dashboard_spaces_occupancy')}
              </Heading>
              <div className="flex-shrink-0 bg-neon-dark rounded-md w-9 h-9 flex items-center justify-center">
                <SpacesIcon />
              </div>
            </div>

            <div className="flex gap-1 justify-between items-end text-sm">
              <div>
                <p className="text-2xl font-bold">30%</p>
                <p> {t('dashboard_booked')}</p>
              </div>
              <div>
                <span className="text-xl">56</span> {t('dashboard_rooms')}
              </div>
            </div>
          </Card>
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
