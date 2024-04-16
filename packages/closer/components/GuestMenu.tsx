import { __ } from '../utils/helpers';
import ReportABug from './ReportABug';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import NavLink from './ui/NavLink';

const GuestMenu = () => {
  return (
    <nav>
      <div className="px-4 pb-6 shadow-xl relative rounded-lg border-3 flex flex-col gap-3">
        <QuestionMarkIcon className="w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2" />
        <p className="pt-16 mb-4 text-center">{__('navigation_sign_in_cta')}</p>

        <NavLink href="/login">{__('navigation_sign_in')}</NavLink>
        <NavLink href="/signup">{__('navigation_signup')}</NavLink>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true' && (
          <NavLink href="/subscriptions">
            {__('navigation_subscriptions')}
          </NavLink>
        )}

        <NavLink href="/events">{__('navigation_events')}</NavLink>
        <NavLink href="/stay">{__('navigation_stay')}</NavLink>
        <NavLink href="/volunteer">{__('navigation_volunteer')}</NavLink>
        <NavLink href="/resources">{__('navigation_resources')}</NavLink>

        {process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' && (
          <NavLink href="/support-us">
            {__('support_us_navigation')}
          </NavLink>
        )}
        {process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true' && (
          <NavLink href="/learn/category/all">
            {__('navigation_online_courses')}
          </NavLink>
        )}
        {process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true' && (
          <NavLink href="/blog">{__('navigation_blog')}</NavLink>
        )}

        <ReportABug />
      </div>
    </nav>
  );
};

export default GuestMenu;
