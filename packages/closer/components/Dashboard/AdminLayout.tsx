import { useRouter } from 'next/router';
import React from 'react';

import DashboardMobileNav from './DashboardMobileNav';
import DashboardNav from './DashboardNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  flush?: boolean;
}

const isPageEditorRoute = (pathname: string, asPath: string): boolean => {
  if (pathname === '/dashboard/pages/[id]') return true;
  const path = asPath.split('?')[0];
  return (
    path.startsWith('/dashboard/pages/') &&
    path !== '/dashboard/pages' &&
    !path.endsWith('/dashboard/pages/')
  );
};

const AdminLayout = ({ children, flush = false }: AdminLayoutProps) => {
  const router = useRouter();
  const isFlush =
    flush || isPageEditorRoute(router.pathname, router.asPath);

  return (
    <>
      <DashboardMobileNav />
      <div
        className={
          isFlush
            ? 'flex h-full min-h-0 pt-12 xl:pt-0'
            : 'flex min-h-screen pt-12 xl:pt-0'
        }
      >
        <DashboardNav />

        <main
          className={
            isFlush
              ? 'w-full xl:w-[calc(100vw-210px)] !bg-white flex-grow !p-0 !px-0 !py-0 flex flex-col min-h-0 h-full'
              : 'w-full xl:w-[calc(100vw-210px)] bg-white sm:bg-neutral-light flex-grow px-0 sm:px-6 py-4 flex flex-col gap-3'
          }
        >
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
