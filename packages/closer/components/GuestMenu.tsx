import { useTranslations } from 'next-intl';

import ReportABug from './ReportABug';
import QuestionMarkIcon from './icons/QuestionMarkIcon';
import NavLink from './ui/NavLink';

const GuestMenu = () => {
  const t = useTranslations();
  return (
    <nav>
      <div className="px-4 pb-6 shadow-xl relative rounded-lg border-3 flex flex-col gap-3">
        <QuestionMarkIcon className="w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2" />
        <p className="pt-16 mb-4 text-center">{t('navigation_sign_in_cta')}</p>

        <NavLink href="/login">{t('navigation_sign_in')}</NavLink>
        <NavLink href="/signup">{t('navigation_signup')}</NavLink>
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true' && (
          <NavLink href="/subscriptions">
            {t('navigation_subscriptions')}
          </NavLink>
        )}

        <NavLink href="/events">{t('navigation_events')}</NavLink>
        <NavLink href="/stay">{t('navigation_stay')}</NavLink>
        <NavLink href="/volunteer">{t('navigation_volunteer')}</NavLink>
        <NavLink href="/resources">{t('navigation_resources')}</NavLink>

        {process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' && (
          <NavLink href="/support-us">{t('support_us_navigation')}</NavLink>
        )}
        {process.env.NEXT_PUBLIC_FEATURE_COURSES === 'true' && (
          <NavLink href="/learn/category/all">
            {t('navigation_online_courses')}
          </NavLink>
        )}
        {process.env.NEXT_PUBLIC_FEATURE_BLOG === 'true' && (
          <NavLink href="/blog">{t('navigation_blog')}</NavLink>
        )}

        <ReportABug />
      </div>
    </nav>
  );
};

export default GuestMenu;
