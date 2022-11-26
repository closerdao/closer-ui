import { __ } from '../utils/helpers';
import { Counter } from './Counter';

export const BookingGuests = ({
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
      <h2 className="text-2xl leading-10 font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center">
        <span className="mr-1">👨‍👩‍👦</span>
        <span>{__('bookings_dates_step_guests_title')}</span>
      </h2>
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
