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

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const hideFloatingPrompt = ROUTES_WITHOUT_FLOATING_PROMPT.includes(
    router.pathname,
  );

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
