import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { NavigationLink } from '../types/nav';
import { __ } from '../utils/helpers';
import { links } from '../utils/navigation';
import Profile from './Profile';
import ReportABug from './ReportABug';
import Wallet from './Wallet';
import NavLink from './ui/NavLink';
import Switcher from './ui/Switcher';

const filterLinks = (option: string, roles: string[]) => {
  switch (option) {
    case 'Guest':
    case 'member':
      if (roles.includes('member')) {
        return links.filter((link: NavigationLink) => {
          return (
            (link.enabled &&
              link.roles &&
              !link.roles.includes('admin') &&
              !link.roles.includes('steward') &&
              !link.roles.includes('event-creator') &&
              !link.roles.includes('space-host')) ||
            !link.roles
          );
        });
      } else {
        return links.filter((link: NavigationLink) => {
          return (
            (link.enabled &&
              link.roles &&
              !link.roles.includes('admin') &&
              !link.roles.includes('member') &&
              !link.roles.includes('steward') &&
              !link.roles.includes('event-creator') &&
              !link.roles.includes('space-host')) ||
            !link.roles
          );
        });
      }
    case 'Admin':
      return links.filter((link: NavigationLink) => {
        if (link.roles) {
          return roles.includes(link.roles[0]) && link.roles[0] !== 'member';
        }
      });
  }
};

const MemberMenu = () => {
  const { user, logout } = useAuth();
  const [navOptions, setNavOptions] = useState(['guest']);
  const [selectedSwitcherOption, setSelectedSwitcherOption] = useState('Guest');
  const [filteredLinks, setFilteredLinks] = useState<NavigationLink[]>();

  useEffect(() => {
    if (user) {
      if (
        user.roles.includes('admin') ||
        user.roles.includes('space-host') ||
        user.roles.includes('steward') ||
        user.roles.includes('event-creator')
      ) {
        setNavOptions(['Guest', 'Admin']);
      } else {
        if (!user.roles.includes('member')) {
          setNavOptions(['guest']);
          setSelectedSwitcherOption('Guest');
        }
        if (user.roles.includes('member')) {
          setNavOptions(['guest']);
          setSelectedSwitcherOption('member');
        }
      }
    }
  }, [user]);

  useEffect(() => {
    setFilteredLinks(filterLinks(selectedSwitcherOption, user?.roles || []));
  }, [selectedSwitcherOption]);

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  return (
    <nav className="flex flex-col gap-4 ">
      <Profile isDemo={false} />
      {isWalletEnabled && <Wallet />}

      {navOptions.length > 1 && (
        <div className="mb-8 mt-4">
          <Switcher
            options={navOptions}
            selectedOption={selectedSwitcherOption}
            setSelectedOption={setSelectedSwitcherOption}
          />
        </div>
      )}

      {filteredLinks &&
        filteredLinks.map((link: NavigationLink) => (
          <NavLink key={link.url} href={link.url} target={link.target}>
            {link.label}
          </NavLink>
        ))}

      <NavLink isButton={true} onClick={logout}>
        {__('navigation_sign_out')}
      </NavLink>

      <ReportABug />
    </nav>
  );
};

export default MemberMenu;
