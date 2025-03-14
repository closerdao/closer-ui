import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import Bookings from '../Bookings';
import Tabs from '../Tabs';

interface Props {
  user: User;
  isSpaceHostView?: boolean;
}

const UserBookingsComponent = ({ user, isSpaceHostView }: Props) => {
  const t = useTranslations();
  const bookingsToShowLimit = 50;

  const [page, setPage] = useState(1);

  const filters = {
    myBookings: user && {
      where: {
        createdBy: user._id,
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
        createdBy: user._id,
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
