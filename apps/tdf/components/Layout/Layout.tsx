import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto max-w-6xl">
      <Navigation />
      {children}
      <Footer />
    </div>
  );
};
