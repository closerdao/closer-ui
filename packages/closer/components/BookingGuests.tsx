import { useTranslations } from 'next-intl';

import { IconUsers } from './BookingIcons';
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
  shouldHideTitle?: boolean;
  isPrivate?: boolean;
  friendsBookingMaxGuests?: number;
  isFriendsBooking?: boolean;
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
  shouldHideTitle,
  isPrivate = false,
  friendsBookingMaxGuests,
  isFriendsBooking,
}: Props) => {
  const t = useTranslations();
  return (
    <div>
      {!shouldHideTitle && (
        <HeadingRow>
          <IconUsers className="!mr-0" />
          <span>{t('bookings_dates_step_guests_title')}</span>
        </HeadingRow>
      )}

      <div className="mt-2">
        {isFriendsBooking && (
          <div className="bg-yellow-50 px-2 py-1.5 rounded-lg my-1">
            Max guests for friends bookings: {friendsBookingMaxGuests}
          </div>
        )}
        <div className="flex space-between items-center">
          <p className="flex-1">{t('bookings_dates_step_guests_adults')}</p>
          <Counter
            value={adults}
            setFn={setAdults}
            minValue={1}
            maxValue={isFriendsBooking ? friendsBookingMaxGuests : undefined}
          />
        </div>
        <div className="flex space-between items-center mt-3">
          <p className="flex-1">{t('bookings_dates_step_guests_children')}</p>
          <Counter value={kids} setFn={setKids} minValue={0} />
        </div>
        <div className="flex space-between items-center mt-3">
          <p className="flex-1">{t('bookings_dates_step_guests_infants')}</p>
          <Counter value={infants} setFn={setInfants} minValue={0} />
        </div>
        <div className="flex space-between items-center mt-3">
          <p className="flex-1">{t('bookings_dates_step_guests_pets')}</p>
          <Counter value={pets} setFn={setPets} minValue={0} />
        </div>
        {adults > 1 && isPrivate && (
          <div className="mt-3 flex flex-row justify-between items-start">
            <label
              htmlFor="separateBeds"
              className={`${shouldHideTitle ? 'text-sm' : 'text-md'}  `}
            >
              {t('bookings_does_prefer_single_beds')}
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
