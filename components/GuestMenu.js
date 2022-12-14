import Link from 'next/link';

import { __ } from '../utils/helpers';
import QuestionMarkIcon from './icons/QuestionMarkIcon';

const GuestMenu = () => (
  <nav>
    <div className="px-4 pb-8 shadow-xl relative rounded-lg">
      <QuestionMarkIcon className="w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2" />
      <p className="pt-16 mb-4 text-center">{__('navigation_sign_in_cta')}</p>
      <Link href="/login" passHref>
        <a>
          <button className="btn w-full uppercase mb-3">
            {__('navigation_sign_in')}
          </button>
        </a>
      </Link>
      <Link href="/signup" passHref>
        <a>
          <button className="btn w-full uppercase">
            {__('navigation_register')}
          </button>
        </a>
      </Link>
    </div>
    <div className="flex flex-col gap-4 mt-4">
      <Link href="/events" passHref>
        <a>
          <button className="btn w-full uppercase">
            {__('navigation_events')}
          </button>
        </a>
      </Link>
    </div>
  </nav>
);

export default GuestMenu;
