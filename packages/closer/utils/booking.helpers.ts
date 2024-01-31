import dayjs from 'dayjs';

import { __ } from './helpers';

export const getStatusText = (status: string, updated: string | Date) => {
  if (status === 'cancelled') {
    return __('booking_status_cancelled', dayjs(updated).format('DD/MM/YYYY'));
  }

  interface StatusText {
    [key: string]: string;
  }

  const statusText: StatusText = {
    rejected: __('booking_status_rejected'),
    open: __('booking_status_open'),
    pending: __('booking_status_pending'),

    confirmed: __('booking_status_confirmed'),
    paid: __('booking_status_paid'),

    'checked-in': __('booking_status_checked_in'),
    'checked-out': __('booking_status_checked_out'),
  };

  return statusText[status];
};

export const getBookingType = (
  eventId: string | undefined,
  volunteerId: string | undefined,
) => {
  if (eventId) {
    return '🎉 Event';
  }
  if (volunteerId) {
    return '💪🏽 Volunteer';
  }
  return '🏡 Stay';
};

export const getFiatTotal = (
  isTeamBooking: boolean,
  foodOption: string,
  utilityTotal: number,
  accomodationTotal: number,
) => {
  if (isTeamBooking) {
    return 0;
  }
  if (foodOption === 'no_food') {
    return accomodationTotal;
  }
  return utilityTotal + accomodationTotal;
};
