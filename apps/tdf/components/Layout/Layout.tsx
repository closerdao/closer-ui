import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto max-w-6xl w-full font-marketing font-[500]">
      <Navigation />
      <div className="p-6 flex flex-1 flex-col items-center w-full">
        {children}
      </div>
      <Footer />
    </div>
  );
};
