import React from 'react';

import DashboardMobileNav from './DashboardMobileNav';
import DashboardNav from './DashboardNav';

interface AdminLayoutProps {
  isBookingEnabled?: boolean;
  children: React.ReactNode;
}

const AdminLayout = ({ children, isBookingEnabled }: AdminLayoutProps) => {
  return (
    <>
      <DashboardMobileNav isBookingEnabled={isBookingEnabled} />
      <div className="flex min-h-screen pt-12 xl:pt-0">
        <DashboardNav isBookingEnabled={isBookingEnabled} />

        <main className="w-full xl:w-[calc(100vw-210px)] bg-white sm:bg-neutral-light flex-grow px-0 sm:px-6 py-4 flex flex-col gap-3">
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminLayout;
