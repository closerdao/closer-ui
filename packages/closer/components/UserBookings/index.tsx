import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { BookingConfig } from '../../types/api';
import { pastBookingsList, upcomingBookingsList } from '../../utils/bookings';
import Bookings from '../Bookings';
import Tabs from '../Tabs';

interface Props {
  user: User;
  isSpaceHostView?: boolean;
  bookingConfig?: BookingConfig;
  hideExportCsv?: boolean;
}

const UserBookingsComponent = ({
  user,
  isSpaceHostView,
  bookingConfig,
  hideExportCsv = true,
}: Props) => {
  const t = useTranslations();
  const bookingsToShowLimit = 50;

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const upcoming = upcomingBookingsList(user, bookingsToShowLimit);
  const past = pastBookingsList(user, bookingsToShowLimit);

  return (
    <div className="max-w-screen-lg mx-auto">
      <Tabs
        tabs={[
          {
            title: t('bookings_upcoming_tab'),
            value: 'my-bookings',
            content: (
              <Bookings
                page={upcomingPage}
                setPage={setUpcomingPage}
                filter={upcoming.filter}
                query={upcoming.query}
                bookingConfig={bookingConfig}
                hideExportCsv={hideExportCsv}
                previewAsAdmin={Boolean(isSpaceHostView)}
                bookingDetailHrefPrefix="/stay"
              />
            ),
          },
          {
            title: t('past_bookings_title'),
            value: 'past-bookings',
            content: (
              <Bookings
                page={pastPage}
                setPage={setPastPage}
                filter={past.filter}
                query={past.query}
                bookingConfig={bookingConfig}
                hideExportCsv={hideExportCsv}
                previewAsAdmin={Boolean(isSpaceHostView)}
                bookingDetailHrefPrefix="/stay"
              />
            ),
          },
        ].filter((tab) => tab?.content)}
      />
    </div>
  );
};

const UserBookings = React.memo(UserBookingsComponent);

export default UserBookings;
