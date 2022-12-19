import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import GuestMenu from './GuestMenu';
import Logo from './Logo';
import MemberMenu from './MemberMenu';
import Menu from './MenuContainer';

const Navigation = () => {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = () => {
    setNavOpen((isOpen) => !isOpen);
  };

  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', toggleNav);
    router.events.on('routeChangeError', toggleNav);

    return () => {
      router.events.off('routeChangeComplete', toggleNav);
      router.events.off('routeChangeError', toggleNav);
    };
  }, [router]);

  const { isAuthenticated } = useAuth();

  return (
    <div className="NavContainer pt-20 md:pt-0 relative z-20">
      <div className="main-content h-20 fixed z-50 top-0 left-0 right-0 shadow-sm md:relative  flex justify-between items-center">
        <Logo />
        <Menu isOpen={navOpen} toggleNav={toggleNav}>
          {isAuthenticated ? <MemberMenu /> : <GuestMenu />}
        </Menu>
      </div>
    </div>
  );
};

export default Navigation;
