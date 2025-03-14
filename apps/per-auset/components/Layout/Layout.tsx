import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';
import { cabinet, hoover, sincopa } from '@/public/fonts/fonts';

import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full">
      <div
        className={`${hoover.variable} ${cabinet.variable} ${sincopa.variable} font-sans`}
      >
        <Navigation />
        <div className="p-4">{children}</div>
        <Footer />
      </div>
    </div>
  );
};
