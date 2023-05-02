import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';
import Counter from './Counter';
import HeadingRow from './ui/HeadingRow';

const BookingGuests = ({
  adults,
  kids,
  infants,
  pets,
  setAdults,
  setKids,
  setInfants,
  setPets,
}) => {
  return (
    <div>
      <HeadingRow>
        <span className="mr-2">👨‍👩‍👦</span>
        <span>{__('bookings_dates_step_guests_title')}</span>
      </HeadingRow>
      <div className="mt-4">
        <div className="flex space-between items-center">
          <p className="flex-1">{__('bookings_dates_step_guests_adults')}</p>
          <Counter value={adults} setFn={setAdults} minValue={1} />
        </div>
        <div className="flex space-between items-center mt-9">
          <p className="flex-1">{__('bookings_dates_step_guests_children')}</p>
          <Counter value={kids} setFn={setKids} minValue={0} />
        </div>
        <div className="flex space-between items-center mt-9">
          <p className="flex-1">{__('bookings_dates_step_guests_infants')}</p>
          <Counter value={infants} setFn={setInfants} minValue={0} />
        </div>
        <div className="flex space-between items-center mt-9">
          <p className="flex-1">{__('bookings_dates_step_guests_pets')}</p>
          <Counter value={pets} setFn={setPets} minValue={0} />
        </div>
      </div>
    </div>
  );
};

BookingGuests.propTypes = {
  adults: PropTypes.number,
  kids: PropTypes.number,
  infants: PropTypes.number,
  pets: PropTypes.number,
  setAdults: PropTypes.func,
  setKids: PropTypes.func,
  setInfants: PropTypes.func,
  setPets: PropTypes.func,
};

export default BookingGuests;
