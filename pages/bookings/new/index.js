import { useRouter } from 'next/router';

import { useEffect } from 'react';

const NewBooking = () => {
  const router = useRouter();
  useEffect(() => {
    router.push('/bookings/new/guests');
  }, []);

  return <></>;
};

export default NewBooking;
