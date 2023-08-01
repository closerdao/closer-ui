import { __ } from '../utils/helpers';
import Counter from './Counter';
import Switch from './Switch';
import HeadingRow from './ui/HeadingRow';

interface Props {
  adults: number;
  kids: number;
  infants: number;
  pets: number;
  setAdults: (value: number) => void;
  setKids: (value: number) => void;
  setInfants: (value: number) => void;
  setPets: (value: number) => void;
  doesNeedSeparateBeds?: boolean;
  setDoesNeedSeparateBeds?: (value: boolean) => void;
}

const BookingGuests = ({
  adults,
  kids,
  infants,
  pets,
  setAdults,
  setKids,
  setInfants,
  setPets,
  doesNeedSeparateBeds,
  setDoesNeedSeparateBeds,
}: Props) => {
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
        {adults > 1 && (
          <div className="my-10 flex flex-row justify-between">
            <label htmlFor="separateBeds" className="text-md">
              {__('bookings_does_need_double_bed')}
            </label>
            <Switch
              disabled={false}
              name="separateBeds"
              label=""
              onChange={setDoesNeedSeparateBeds}
              checked={doesNeedSeparateBeds}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingGuests;
