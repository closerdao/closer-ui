import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';
import { alegreyaSans } from '@/public/fonts/fonts';
import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-dominant">
      <div
        className={`${alegreyaSans.variable} font-sans`}
      >
        <Navigation />
        <div>{children}</div>
        <Footer />
      </div>
    </div>
  );
};
