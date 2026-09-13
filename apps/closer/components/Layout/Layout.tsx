import { useRouter } from 'next/router';

import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';
import { inter, instrumentSerif } from '@/public/fonts/fonts';

import CloserEmailCollector from 'closer/components/CloserEmailCollector';

import { Navigation, isFullScreenRoute } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  // A full-screen route draws its own header, progress and footer; wrapping it
  // in the site chrome would stack two navigations on one screen.
  if (isFullScreenRoute(router.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-dominant ">
      <div className={`${inter.variable} ${instrumentSerif.variable} font-sans`}>
        <CloserEmailCollector />
        <Navigation />
        <div>{children}</div>
        <Footer />
      </div>
    </div>
  );
};
