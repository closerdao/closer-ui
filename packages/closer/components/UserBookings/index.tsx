import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
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
  hideExportCsv = false,
}: Props) => {
  const t = useTranslations();
  const bookingsToShowLimit = 50;

  const { user: currentUser } = useAuth();
  console.log('=== currentUser=', currentUser);

  const [page, setPage] = useState(1);

  const filters = {
    myBookings: user && {
      where: {
        $or: [
          { createdBy: user._id },
          { managedBy: { $in: [user._id] } },
          {
            $and: [
              { isFriendsBooking: { $eq: true } },
              { friendEmails: { $exists: true } },
              { friendEmails: { $ne: [] } },
              { friendEmails: { $in: [user.email] } },
            ],
          },
        ],
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
        $or: [{ createdBy: user._id }, { friendEmails: { $in: [user.email] } }],
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
            title: isSpaceHostView
              ? t('bookings_title_user')
              : t('bookings_title'),
            value: 'my-bookings',
            content: (
              <Bookings
                page={page}
                setPage={setPage}
                filter={filters.myBookings}
                bookingConfig={bookingConfig}
                hideExportCsv={true}
              />
            ),
          },
          {
            title: t('past_bookings_title'),
            value: 'past-bookings',
            content: (
              <Bookings
                page={page}
                setPage={setPage}
                filter={filters.pastBookings}
                hideExportCsv={true}
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
