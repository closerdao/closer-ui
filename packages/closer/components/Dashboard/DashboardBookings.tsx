import { useEffect, useState } from 'react';

import ArrivingIcon from '../../components/icons/ArrivingIcon';
import DepartingIcon from '../../components/icons/DepartingIcon';
import HospitalityIcon from '../../components/icons/HospitalityIcon';
import SpacesIcon from '../../components/icons/SpacesIcon';
import { Card, Heading } from '../../components/ui';
import DonutChart from '../../components/ui/Charts/DonutChart';

import { useTranslations } from 'next-intl';

import { MAX_BOOKINGS_TO_FETCH } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import BookingsIcon from '../icons/BookingsIcon';
import TimeFrameSelector from './TimeFrameSelector';

const applicationsData = [
  { name: 'Open', value: 28 },
  { name: 'Confirmed', value: 10 },
  { name: 'Paid', value: 3 },
];
const peopleData = [
  { name: 'Guests', value: 17 },
  { name: 'Volunteers', value: 12 },
  { name: 'Team', value: 2 },
];

interface WhereFilter {
  [key: string]: any;
}

interface Filter {
  where: WhereFilter;
  limit?: number;
  start?: DateRangeFilter;
}

interface DateRangeFilter {
  $lte?: Date;
  $gte?: Date;
}

const DashboardBookings = () => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const defaultWhere = {
    status: { $ne: 'open' },
  };
  const [isLoading, setIsLoading] = useState(false);

  const [timeFrame, setTimeFrame] = useState('week');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({
    where: defaultWhere,
    limit: MAX_BOOKINGS_TO_FETCH,
    // start: {
    //   $lte: new Date(filterValues.arrivalToDate),
    //   $gte: arrivalFrom,
    // },
  });
  const bookings = platform.booking.find(filter);

  console.log(
    'bookings=',
    bookings && bookings.toJS().map((booking: any) => booking.status),
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      // platform.booking.get(filter);
      platform.booking.get(filter);
      // if (bookings) {
      //   await Promise.all([
      //     platform.event.get(eventsFilter),
      //     platform.volunteer.get(volunteerFilter),
      //     platform.listing.get(listingFilter),
      //     platform.user.get({ limit: MAX_USERS_TO_FETCH }),
      //   ]);
      // }
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
    if (fromDate && toDate) {
      setFilter({
        ...filter,
        where: {
          $and: [
            { start: { $lte: new Date(toDate) } },
            { end: { $gte: new Date(fromDate) } },
            { status: { $eq: 'paid' } },
            // {
            //   $or: [
            //     { status: { $eq: 'paid' } },
            //     { status: { $eq: 'credits-paid' } },
            //     { status: { $eq: 'tokens-staked' } },
            //   ],
            // },
          ],
        },
      });
    }
  }, [toDate, fromDate]);

  useEffect(() => {
    switch (timeFrame) {
      case 'today':
        setFromDate(new Date().toISOString());
        setToDate(new Date().toISOString());
        break;
      case 'week':
        setFromDate(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        );
        setToDate(new Date().toISOString());
        break;
      case 'month':
        setFromDate(new Date().toISOString());
        setToDate(new Date().toISOString());
        break;
      case 'year':
        setFromDate(new Date().toISOString());
        setToDate(new Date().toISOString());
        break;
      default:
        break;
    }
  }, [timeFrame]);

  return (
    <section className="bg-white rounded-md p-6 flex flex-col gap-6">
      <div>{fromDate}</div>
      <div>{toDate}</div>
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
                <p className="text-2xl font-bold">30%</p>
                <p> {t('dashboard_booked')}</p>
              </div>
              <div>
                <span className="text-xl">56</span> {t('dashboard_rooms')}
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
