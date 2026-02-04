import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import { User } from 'lucide-react';
import { Settings, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { cdn } from '../utils/api';
import CreditsBalance from './CreditsBalance';
import { Button, Heading } from './ui';

interface ProfileProps {
  isMenu?: boolean;
  isDemo?: boolean;
  onLogout?: () => void;
}

const Profile = ({ isMenu = false, isDemo, onLogout }: ProfileProps) => {
  const t = useTranslations();

  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if ((!isAuthenticated || !user) && !isDemo) {
      router.push(`/login?back=${router.asPath}`);
    }
  }, [isAuthenticated, user]);

  const isCreditsEnabled = process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true';

  return (
    <div className="w-full ">
      <div className="py-2  relative rounded-lg w-full ">
        <div className="flex items-center">
          <div className="flex gap-2 items-center">
            <div className="flex items-center md:w-10 md:h-10 mx-auto ">
              <Link
                href={`/members/${user?.slug}`}
                passHref
                title="View profile"
                className={`${
                  isMenu ? 'w-10 h-10 ' : ''
                } md:flex md:flex-row items-center cursor-pointer`}
              >
                {user?.photo ? (
                  <img
                    src={`${cdn}${user.photo}-profile-lg.jpg`}
                    loading="lazy"
                    alt={user.screenname}
                    className="rounded-full "
                  />
                ) : (
                  <div className="flex items-center justify-center bg-gray-50 rounded-full overflow-hidden pt-1 h-10 w-10">
                    <User className="text-gray-200 w-10 h-10" />
                  </div>
                )}
              </Link>
            </div>
            <div className="flex flex-col ">
              <Heading level={2} className="text-md ">
                {user?.screenname}
              </Heading>
              {isCreditsEnabled && (
                <CreditsBalance className="text-md" isDemo={isDemo} />
              )}
              {process.env.NEXT_PUBLIC_FEATURE_REFERRAL === 'true' && (
                <Link href="/settings/referrals" className="text-xs text-accent hover:underline">
                  {t('navigation_refer_a_friend')}
                </Link>
              )}
            </div>
          </div>

          <div className=" absolute right-0 flex flex-col gap-1">
            <Button
              onClick={() => {
                router.push('/settings');
              }}
              variant="secondary"
              size="small"
              className="text-xs normal-case !w-fit !bg-black !text-white hover:!bg-gray-800 ml-auto py-0 !h-6 !px-2 !border-0 flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              {t('buttons_edit_profile')}
            </Button>
            {isMenu && onLogout && (
              <Button
                onClick={onLogout}
                variant="secondary"
                size="small"
                className="text-xs normal-case !w-fit !bg-black !text-white hover:!bg-gray-800 ml-auto py-0 !h-6 !px-2 !border-0 flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                {t('navigation_sign_out')}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center">
          {/* <p>
            {user?.preferences?.superpower
              ? user?.preferences?.superpower
              : ''}
          </p> */}
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
      </div>
    </div>
  );
};

export default Profile;

