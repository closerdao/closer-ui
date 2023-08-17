import { __ } from '../utils/helpers';
import ReportABug from './ReportABug';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import NavLink from './ui/NavLink';

const GuestMenu = () => (
  <nav>
    <div className="px-4 pb-6 shadow-xl relative rounded-lg border-3 flex flex-col gap-3">
      <QuestionMarkIcon className="w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2" />
      <p className="pt-16 mb-4 text-center">{__('navigation_sign_in_cta')}</p>

      <NavLink href="/login">{__('navigation_sign_in')}</NavLink>
      <NavLink href="/signup">{__('navigation_signup')}</NavLink>
    </div>
    <div className="flex flex-col gap-3 mt-4">
      <NavLink href="/subscriptions">{__('navigation_subscriptions')}</NavLink>
      <NavLink href="/events">{__('navigation_events')}</NavLink>
      <NavLink href="/volunteer">{__('navigation_volunteer')}</NavLink>
      <NavLink href="/resources">{__('navigation_resources')}</NavLink>

      <ReportABug />
    </div>
  </nav>
);

export default GuestMenu;
