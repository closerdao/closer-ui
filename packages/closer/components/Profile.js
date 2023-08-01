import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import { __ } from '../utils/helpers.js';
import CreditsBalance from './CreditsBalance';
import { Button, Heading } from './ui';

const Profile = ({ isDemo }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if ((!isAuthenticated || !user) && !isDemo) {
      router.push(`/login?back=${router.asPath}`);
    }
  }, [isAuthenticated, user]);

  const isCreditsEnabled = process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true';

  return (
    <div className="w-full">
      <div className="py-4 px-2 shadow-xl relative rounded-lg w-full">
        <div className="flex items-start">
          <div className="flex justify-center items-center w-24 h-24 md:w-32 md:h-32 mx-auto mb-4">
            <Link
              href={`/members/${user?.slug}`}
              passHref
              title="View profile"
              className="md:flex md:flex-row items-center cursor-pointer"
            >
              {user?.photo ? (
                <img
                  src={`${cdn}${user.photo}-profile-lg.jpg`}
                  loading="lazy"
                  alt={user.screenname}
                  className="rounded-full "
                />
              ) : (
                <FaUser className="text-gray-200 text-6xl" />
              )}
            </Link>
          </div>

          <div className="w-1/3 absolute right-4">
            <Button
              onClick={() => {
                router.push('/settings');
              }}
              type="secondary"
              className="!w-[80px] !text-accent ml-auto"
            >
              {__('generic_edit_button')}
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Heading level={2} className="font-bold">
            {user?.screenname}
          </Heading>
          <p>
            {user?.preferences?.superpower
              ? user?.preferences?.superpower
              : __('navigation_member')}{' '}
          </p>
          {/* <div className="mt-1 w-full">
            {user.roles && (
              <div className="text-sm mt-1 tags">
                {user.roles.map((role) => (
                  <Link
                    as={`/members?role=${encodeURIComponent(role)}`}
                    href="/members"
                    key={role}
                  >
                    <a className="tag">{role}</a>
                  </Link>
                ))}
              </div>
            )}
          </div> */}
        </div>
        <div className="flex space-between justify-center w-full">
          {isCreditsEnabled && <CreditsBalance isDemo={isDemo} />}
        </div>
      </div>
    </div>
  );
};

export default Profile;
