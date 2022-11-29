import { useRouter } from 'next/router';

import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';

const BookingBackButton = ({ url, resetBooking, goBack }) => {
  const router = useRouter();

  const redirectToUrl = () => {
    if (resetBooking) {
      resetBooking();
    }
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

BookingBackButton.propTypes = {
  url: PropTypes.string,
  resetBooking: PropTypes.func,
  goBack: PropTypes.func,
};

export default BookingBackButton;
