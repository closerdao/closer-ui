import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Navigation } from 'closer';
import Prompts from '../Prompts';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full">
      <Navigation />
      <Prompts/>
      <div className="p-4">{children}</div>
      <Footer />
    </div>
  );
};
