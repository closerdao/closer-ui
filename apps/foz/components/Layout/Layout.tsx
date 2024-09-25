import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-white">
      <Navigation />
      <div className="p-4">{children}</div>
      <Footer />
    </div>
  );
};
