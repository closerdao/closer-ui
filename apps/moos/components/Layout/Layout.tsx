import { useRouter } from 'next/router';

import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Navigation, isFullScreenRoute } from 'closer';
import Prompts from '../Prompts';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  // A full-screen route draws its own header, progress and footer; wrapping it
  // in the site chrome would stack two navigations on one screen.
  if (isFullScreenRoute(router.pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-background">
      <Navigation />
      <Prompts/>
      <div className="p-4">{children}</div>
      <Footer />
    </div>
  );
};
