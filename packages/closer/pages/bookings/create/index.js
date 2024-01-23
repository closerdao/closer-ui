import { useRouter } from 'next/router';

import { useEffect } from 'react';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import '../../../utils/helpers';

const NewBooking = () => {
  const { enabledConfigs } = useConfig();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/bookings/create/dates');
    }
  }, [isAuthenticated]);

  if (
    process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true' ||
    (enabledConfigs && !enabledConfigs.includes('booking'))
  ) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return null;
};

export default NewBooking;
