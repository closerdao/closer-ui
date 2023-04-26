import Link from 'next/link';

import { __ } from '../utils/helpers';
import Heading from './ui/Heading';

const CancelCompleted = () => {
  return (
    <div className="main-content max-w-prose pb-16">
      <Heading className="text-[32px] leading-[48px] font-normal border-b border-[#e1e1e1] border-solid pb-2">
        <span className="text-red-500">X </span>
        <span>{__('cancel_booking_completed_title')}</span>
      </Heading>
      <h2 className="text-2xl leading-10 font-normal my-16">
        {__('cancel_booking_completed_subtitle')}
      </h2>
      <p className="my-16">{__('cancel_booking_completed_body')}</p>
      <div className="flex flex-col">
        <Link href="/bookings" passHref className="btn">
          {__('generic_ok').toUpperCase()}
        </Link>
      </div>
    </div>
  );
};

export default CancelCompleted;
