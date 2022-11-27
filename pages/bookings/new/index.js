import { useRouter } from 'next/router';

import { useEffect } from 'react';
import React from 'react';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { BOOKING_PATHS } from '../../../utils/const';

const NewBooking = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [firstStepUrl] = BOOKING_PATHS;

  useEffect(() => {
    if (isAuthenticated) {
      router.push(firstStepUrl);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return null;
};

export default NewBooking;
