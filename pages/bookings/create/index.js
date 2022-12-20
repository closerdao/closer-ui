import { useRouter } from 'next/router';

import { useEffect } from 'react';
import React from 'react';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';

const NewBooking = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/bookings/create/dates');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return null;
};

export default NewBooking;
