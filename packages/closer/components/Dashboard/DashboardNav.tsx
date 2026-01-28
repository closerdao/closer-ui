import Link from 'next/link';
import { useRouter } from 'next/router';

import { useTranslations } from 'next-intl';

import { getDashboardLinks } from './dashboardLinks';
import useRBAC from '../../hooks/useRBAC';

const DashboardNav = ({ isBookingEnabled }: { isBookingEnabled?: boolean }) => {
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
    <nav className="hidden xl:block w-0 xl:w-[200px] flex-shrink-0 px-3 pt-6">
      <div className="flex flex-col gap-1">
        {links.map((link) => {
          const isActive =
            path === link.url ||
            (link.url !== '/dashboard' && path.startsWith(link.url));
          return (
            <Link
              key={link.url}
              href={link.url}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-accent-light font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default DashboardNav;
