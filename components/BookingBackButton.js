import PropTypes from 'prop-types';

const BookingBackButton = ({ name, action }) => {
  return <button onClick={action}>{name}</button>;
};

BookingBackButton.propTypes = {
  url: PropTypes.string,
  resetBooking: PropTypes.func,
  goBack: PropTypes.func,
};

export default BookingBackButton;
