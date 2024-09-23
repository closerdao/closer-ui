import React from 'react';

import DashboardNav from './DashboardNav';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen ">
      <DashboardNav />

      <main className="w-[calc(100vw-230px)] bg-white sm:bg-neutral-light flex-grow px-0 sm:px-6 py-8 flex flex-col gap-4">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
