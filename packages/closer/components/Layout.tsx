import { FC, PropsWithChildren } from 'react';

const Layout: FC<PropsWithChildren> = ({ children }) => (
  <div className="main-content p-6 flex flex-1 flex-col w-full gap-8 mt-20">
    {children}
  </div>
);

export default Layout;
