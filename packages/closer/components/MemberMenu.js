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
      link.enabled &&
      (!link.roles ||
        (isAuthenticated &&
          user.roles.some((role) => link.roles.includes(role)))) &&
      (!link.subscriptions ||
        (isAuthenticated &&
          link.subscriptions.includes(user.subscription?.plan)))
  );

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  return (
    <nav className="flex flex-col gap-4 ">
      <Profile />
      {isWalletEnabled && <Wallet />}
      {filteredLinks.map((link) => (
        <Link
          key={link.url}
          href={link.url}
          target={link.target}
          className="btn uppercase text-center w-full"
        >
          {link.label}
        </Link>
      ))}
      <button className="btn w-full uppercase" onClick={logout}>
        {__('navigation_sign_out')}
      </button>
    </nav>
  );
};

export default MemberMenu;
