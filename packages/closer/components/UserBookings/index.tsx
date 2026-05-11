import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { BookingConfig } from '../../types/api';
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

  const friendOrSelfOr = [
    { createdBy: user._id },
    {
      $and: [
        { isFriendsBooking: { $eq: true } },
        { friendEmails: { $exists: true } },
        { friendEmails: { $ne: [] } },
        { friendEmails: { $in: [user.email] } },
      ],
    },
  ];

  const filters = {
    myBookings: user && {
      where: {
        $or: friendOrSelfOr,
        status: [
          'pending',
          'confirmed',
          'tokens-staked',
          'credits-paid',
          'paid',
          'checked-in',
          'checked-out',
        ],
        end: {
          $gt: new Date(),
        },
      },
      limit: bookingsToShowLimit,
    },
    pastBookings: user && {
      where: {
        $or: friendOrSelfOr,
        end: { $lt: new Date() },
      },
      limit: bookingsToShowLimit,
    },
  };

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
                filter={filters.myBookings}
                bookingConfig={bookingConfig}
                hideExportCsv={hideExportCsv}
                previewAsAdmin={Boolean(isSpaceHostView)}
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
                filter={filters.pastBookings}
                bookingConfig={bookingConfig}
                hideExportCsv={hideExportCsv}
                previewAsAdmin={Boolean(isSpaceHostView)}
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
