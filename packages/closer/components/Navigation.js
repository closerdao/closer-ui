import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import GuestMenu from './GuestMenu';
import Logo from './Logo';
import MemberMenu from './MemberMenu';
import Menu from './MenuContainer';
import ProfilePhoto from './ProfilePhoto';

const Navigation = () => {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNav = () => {
    setNavOpen((isOpen) => !isOpen);
  };

  const closeNav = () => {
    setNavOpen(false);
  };

  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', closeNav);
    router.events.on('routeChangeError', closeNav);

    return () => {
      router.events.off('routeChangeComplete', closeNav);
      router.events.off('routeChangeError', closeNav);
    };
  }, [router]);

  const { isAuthenticated, user } = useAuth();

  return (
    <div className="NavContainer pt-20 md:pt-0 relative z-20">
      <div className="main-content h-20 fixed z-50 top-0 left-0 right-0 shadow-sm md:relative  flex justify-between items-center">
        <Logo />
        <div className="flex gap-4">
          {isAuthenticated && (
            <Link
              href={`/members/${user?.slug}`}
              passHref
              title="View profile"
              className="hidden md:flex md:flex-row items-center z-0"
            >
              <ProfilePhoto user={user} />
            </Link>
          )}
          <Menu isOpen={navOpen} toggleNav={toggleNav}>
            {isAuthenticated ? <MemberMenu /> : <GuestMenu />}
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
