import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { BOOKING_PATHS } from '../../../utils/const';

const NewBooking = () => {
  const router = useRouter();
  const [firstStepUrl] = BOOKING_PATHS;

  useEffect(() => {
    router.push(firstStepUrl);
  }, []);

  return null;
};

export default NewBooking;
