import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';
import { inter } from '@/public/fonts/fonts';
import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-dominant ">
      <div className={`${inter.variable} font-sans`}>
        <Navigation />
        <div className="pt-8 px-4">{children}</div>
        <Footer />
      </div>
    </div>
  );
};
