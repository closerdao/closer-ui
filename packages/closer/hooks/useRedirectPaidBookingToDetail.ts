import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { Booking } from '../types';

export function useRedirectPaidBookingToDetail(
  booking: Booking | null | undefined,
): void {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const id = booking?._id;
    if (!id || booking?.status !== 'paid') return;
    void router.replace(`/bookings/${id}`);
  }, [router.isReady, router, booking?._id, booking?.status]);
}
