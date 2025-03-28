import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import MemberList from './MemberList';
import PostList from './PostList';
import UpcomingEvents from './UpcomingEvents';

const MemberHome = () => {
  const t = useTranslations();
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    // Wait for user to be loaded in order to allow getting private data
    return <div className="loading">{t('generic_loading')} </div>;
  }

  return (
    <main className="main-content w-full">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-2/3 md:mr-8">
          <div className="channel">
            <div className="channel-header mb-4">
              <h3>
                {t('member_home_title')} {user?.screenname || 'you'}!
              </h3>
            </div>
            <div className="channel-sub-header">
              {user.roles.includes('admin') && (
                <Link href="/channel/create" as="/channel/create">
                  {t('member_home_add_channel')}
                </Link>
              )}
            </div>
            <section>
              <PostList channel={null} allowCreate />
            </section>
          </div>
        </div>
        <div className="md:w-2/3">
          {/* Wait for user to be loaded in order to fetch private data */}
          <MemberList list preview card title="Members" limit={3} />
          <br className="h-3" />
          <UpcomingEvents list card title="Events" limit={3} />
        </div>
      </div>
    </main>
  );
};

export default MemberHome;
