import Link from 'next/link';

import { useTranslations } from 'next-intl';

import Heading from './ui/Heading';

const CancelCompleted = () => {
  const t = useTranslations();

  return (
    <div className="main-content max-w-prose pb-16">
      <Heading className="text-[32px] leading-[48px] font-normal border-b border-[#e1e1e1] border-solid pb-2">
        <span className="text-red-500">X </span>
        <span>{t('cancel_booking_completed_title')}</span>
      </Heading>
      <Heading level={2} className="text-2xl leading-10 font-normal my-16">
        {t('cancel_booking_completed_subtitle')}
      </Heading>
      <p className="my-16">{t('cancel_booking_completed_body')}</p>
      <div className="flex flex-col">
        <Link href="/bookings" passHref className="btn">
          {t('generic_ok').toUpperCase()}
        </Link>
      </div>
    </div>
  );
};

export default CancelCompleted;
