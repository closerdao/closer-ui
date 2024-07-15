import { FC } from 'react';

import daysjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { CloserCurrencies } from '../types';
import { formatCurrency } from '../utils/helpers';

interface Props {
  startDate: string;
  endDate: string;
  totalGuests: string;
  savedCurrency?: CloserCurrencies;
  backToDates: () => void;
}

const BookingStepsInfo: FC<Props> = ({
  startDate,
  endDate,
  totalGuests,
  savedCurrency,
  backToDates,
}) => {
  const t = useTranslations();
  return (
    <div className="mt-6 flex justify-between gap-2 flex-wrap md:justify-start">
      <div
        onClick={backToDates}
        className="basis-1/2 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center md:flex-initial cursor-pointer"
      >
        <span className="mr-1">📆</span>
        <span>
          {daysjs(startDate).format('MMM DD')} -{' '}
          {daysjs(endDate).format('MMM DD')}
        </span>
      </div>
      <div
        onClick={backToDates}
        className="flex-1 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal flex justify-between items-center md:flex-initial md:w-40 cursor-pointer"
      >
        <span className="mr-1">👨‍👩‍👦</span>
        <span>{`${totalGuests} ${t('bookings_accomodation_step_guest')}`}</span>
      </div>
      <div
        onClick={backToDates}
        className="flex basis-1/2 border border-solid border-neutral-400 rounded-3xl px-4 py-2 font-normal justify-between items-center md:flex-initial md:w-40 cursor-pointer"
      >
        <span className="mr-1">💰</span>
        <span>{formatCurrency(savedCurrency)}</span>
      </div>
    </div>
  );
};

export default BookingStepsInfo;
