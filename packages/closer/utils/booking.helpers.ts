import axios from 'axios';
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

export const getPaymentMethods = (paymentConfig: any): string[] | [] => {
  const availablePaymentMethods = [];
  if (paymentConfig?.cardPayment.value === true) {
    availablePaymentMethods.push('card');
  }
  if (
    paymentConfig?.cryptoPayment.value === true &&
    (paymentConfig?.polygonWalletAddress.value ||
      paymentConfig?.ethereumWalletAddress.value)
  ) {
    availablePaymentMethods.push('crypto');
  }
  return availablePaymentMethods;
};

export const getExchangeRate = async (fromSymbol: string, toSymbol: string) => {
  // Fixer.io access_key - gives you 1000 free requests per month
  const access_key = '4915747b2189d439ecec3354bc404bf4';
  const result = await axios.get(
    `http://data.fixer.io/api/latest?access_key=${access_key}&base=${fromSymbol}&symbols=${toSymbol}`,
  );
  console.log('result=', result.data.rates[toSymbol]);
  return result.data.rates[toSymbol];
};
