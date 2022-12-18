import Link from 'next/link';

import React from 'react';

import { useAuth } from '../contexts/auth.js';
import { __ } from '../utils/helpers';
import Logo from './Logo';
import Menu from './Menu';
import Profile from './Profile';
import QuestionMarkIcon from './icons/QuestionMarkIcon';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="NavContainer pt-20 md:pt-0 relative z-20">
      <nav className="h-20 fixed z-50 top-0 left-0 right-0 shadow-sm md:relative">
        <div className="main-content flex justify-between items-center">
          <Logo />
          <Menu>
            {isAuthenticated ? (
              <>
                <Profile />
                <button className="btn w-full uppercase" onClick={logout}>
                  {__('navigation_sign_out')}
                </button>
              </>
            ) : (
              <div className="mt-12 px-4 pb-8 shadow-sm relative">
                <QuestionMarkIcon className="w-24 h-24 absolute left-0 right-0 mx-auto -translate-y-1/2" />
                <p className="mt-16 mb-4 text-center">
                  {__('navigation_sign_in_cta')}
                </p>
                <Link href="/login" passHref>
                  <a>
                    <button className="btn w-full uppercase mb-3">
                      {__('navigation_sign_in')}
                    </button>
                  </a>
                </Link>
                <Link href="/signup" passHref>
                  <a>
                    <button className="btn w-full uppercase">
                      {__('navigation_register')}
                    </button>
                  </a>
                </Link>
              </div>
            )}
          </Menu>
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
