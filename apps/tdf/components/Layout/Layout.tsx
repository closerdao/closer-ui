import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components/Footer/Footer';
// import { Footer } from '@/components';
import PromptFixedBottom from 'closer/components/PromptFixedBottom';

import { Navigation, Prompts } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-white">
      <PromptFixedBottom />
      <Navigation />
      <Prompts />
      <div className="p-4">{children}</div>
      <Footer />
    </div>
  );
};
