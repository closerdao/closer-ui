import Link from 'next/link';

import { useTranslations } from 'next-intl';

import type { BookAgainParams } from '../../types/stay';
import { buildBookAgainHref } from '../../utils/booking.helpers';
import Information from '../ui/Information';

const StayBookAgainNotice = ({ stay }: { stay: BookAgainParams }) => {
  const t = useTranslations();

  return (
    <Information>
      {t('stay_ended_book_again_intro')}{' '}
      <Link href={buildBookAgainHref(stay)} className="text-accent underline">
        {t('stay_book_again')}
      </Link>
    </Information>
  );
};

export default StayBookAgainNotice;
