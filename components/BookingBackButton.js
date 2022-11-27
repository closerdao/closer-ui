import { useRouter } from 'next/router';

import { useBookingActions } from '../contexts/booking';
import { __ } from '../utils/helpers';

export const BookingBackButton = ({ url }) => {
  const router = useRouter();
  const { resetBooking, goBack } = useBookingActions();

  const redirectToUrl = () => {
    resetBooking();
    router.push(url);
  };

  if (url) {
    return (
      <button onClick={redirectToUrl}>
        <span>{__('buttons_back_to')}</span>
        <span className="capitalize">{url.slice(1)}</span>
      </button>
    );
  }

  return <button onClick={goBack}>{__('buttons_back')}</button>;
};
