import Link from 'next/link';
import { useRouter } from 'next/router';

import { useTranslations } from 'next-intl';

import { getDashboardLinks } from './dashboardLinks';
import useRBAC from '../../hooks/useRBAC';

const DashboardMobileNav = ({
  isBookingEnabled,
}: {
  isBookingEnabled?: boolean;
}) => {
  const t = useTranslations();
  const router = useRouter();
  const path = router.pathname;
  const { hasAccess } = useRBAC();

  const links = getDashboardLinks(t, isBookingEnabled).filter((link) =>
    hasAccess(link.rbacPage),
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <nav className="xl:hidden fixed top-20 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="overflow-x-auto">
        <div className="flex gap-2 px-4 py-2 min-w-max">
          {links.map((link) => {
            const isActive =
              path === link.url ||
              (link.url !== '/dashboard' && path.startsWith(link.url));
            return (
              <Link
                key={link.url}
                href={link.url}
                className={`px-3 py-1.5 text-sm whitespace-nowrap rounded-full transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default DashboardMobileNav;
