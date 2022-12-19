import Link from 'next/link';

import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';
import { links } from '../utils/navigation';
import Profile from './Profile';
import Wallet from './Wallet';

const MemberMenu = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const filteredLinks = links.filter(
    (link) =>
      (!link.enabled || link.enabled()) &&
      (!link.roles ||
        (isAuthenticated &&
          user.roles.some((role) => link.roles.includes(role)))),
  );

  return (
    <>
      <Profile />
      <div className="my-4">
        <Wallet />
      </div>
      <div className="py-8">
        {filteredLinks.map((link) => (
          <Link key={link.url} href={link.url} target={link.target}>
            <a className="mb-4 btn uppercase text-center w-full">
              {link.label}
            </a>
          </Link>
        ))}
      </div>
      <button className="btn w-full uppercase" onClick={logout}>
        {__('navigation_sign_out')}
      </button>
    </>
  );
};

export default MemberMenu;
