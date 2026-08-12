import { useRouter } from 'next/router';

import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components/Footer/Footer';
import PromptFixedBottom from 'closer/components/PromptFixedBottom';

import { Navigation, Prompts } from 'closer';

const ROUTES_WITHOUT_FLOATING_PROMPT = [
  '/events/[slug]',
  '/stay/[slug]',
  '/signup',
  '/subscriptions',
];

const isDashboardRoute = (pathname: string) =>
  pathname === '/dashboard' || pathname.startsWith('/dashboard/');

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const hideFloatingPrompt = ROUTES_WITHOUT_FLOATING_PROMPT.includes(
    router.pathname,
  );
  const isDashboard = isDashboardRoute(router.pathname);

  const isPagesEditor =
    router.pathname === '/dashboard/pages/[id]' ||
    (router.asPath.split('?')[0].startsWith('/dashboard/pages/') &&
      router.asPath.split('?')[0] !== '/dashboard/pages');

  if (isPagesEditor) {
    return (
      <>
        <Navigation />
        <div className="flex flex-col relative mx-auto mt-20 w-full h-[calc(100vh-5rem)] bg-white overflow-hidden">
          {children}
        </div>
      </>
    );
  }

  if (isDashboard) {
    return (
      <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full min-h-screen bg-white">
        <Navigation />
        <Prompts />
        {children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-white">
      {!hideFloatingPrompt && <PromptFixedBottom />}
      <Navigation />
      <Prompts />
      <div className="p-4">{children}</div>
      <Footer />
    </div>
  );
};
