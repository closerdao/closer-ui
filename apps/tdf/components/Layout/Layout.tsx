import { FC, PropsWithChildren } from 'react';

import { Footer } from '@/components';

import { Newsletter, Prompts } from 'closer';
import { Navigation } from 'closer';

export const Layout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col relative mx-auto mt-20 w-full bg-dominant">
      <Navigation />
      <Prompts />
      <div className="p-4">{children}</div>
      <Newsletter placement="footer" />
      <Footer />
    </div>
  );
};
