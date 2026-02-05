import { FC } from 'react';

import daysjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { IconBanknote, IconCalendar, IconUsers } from './BookingIcons';

import { CloserCurrencies } from '../types';
import { formatCurrency } from '../utils/helpers';

interface Props {
  startDate: string;
  endDate: string;
  totalGuests: string;
  savedCurrency?: CloserCurrencies;
  useTokens?: boolean;
  backToDates: () => void;
}

const BookingStepsInfo: FC<Props> = ({
  startDate,
  endDate,
  totalGuests,
  savedCurrency,
  useTokens = false,
  backToDates,
}) => {
  const t = useTranslations();
  
  const displayCurrency = savedCurrency || (useTokens ? CloserCurrencies.TDF : CloserCurrencies.EUR);
  
  return (
    <div className="mt-4 flex justify-between gap-1.5 flex-wrap md:justify-start">
      <div
        onClick={backToDates}
        className="border border-solid border-neutral-400 rounded-full px-2 py-1 font-normal flex justify-between items-center md:flex-initial cursor-pointer text-sm md:text-base"
      >
        <IconCalendar className="mr-1" />
        <span>
          {daysjs(startDate).format('MMM DD')} -{' '}
          {daysjs(endDate).format('MMM DD')}
        </span>
      </div>
      <div
        onClick={backToDates}
        className="flex-1 border border-solid border-neutral-400 rounded-full px-2 py-1 font-normal flex justify-between items-center md:flex-initial cursor-pointer text-sm md:text-base"
      >
        <IconUsers className="mr-1" />
        <span>{`${totalGuests} ${t('bookings_accomodation_step_guest')}`}</span>
      </div>
      <div
        onClick={backToDates}
        className="flex border border-solid border-neutral-400 rounded-full px-2 py-1 font-normal justify-between items-center md:flex-initial cursor-pointer text-sm md:text-base"
      >
        <IconBanknote className="mr-1" />
        <span>{formatCurrency(displayCurrency)}</span>
      </div>
    </div>
  );
};

export default BookingStepsInfo;
