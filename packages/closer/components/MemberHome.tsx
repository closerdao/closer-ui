import Link from 'next/link';

import React, { ReactNode, useState } from 'react';

import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaHashtag } from '@react-icons/all-files/fa/FaHashtag';
import { FaUsers } from '@react-icons/all-files/fa/FaUsers';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { User } from '../contexts/auth/types';
import MemberList from './MemberList';
import PostList from './PostList';
import ProfilePhoto from './ProfilePhoto';
import UpcomingEvents from './UpcomingEvents';

type TabType = 'feed' | 'members' | 'events';
type TranslateFn = (key: string) => string;

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

const TabButton = ({ active, onClick, icon, label }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
      active
        ? 'text-accent border-accent'
        : 'text-gray-500 border-transparent hover:text-foreground hover:border-line/30'
    }`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const WelcomeCard = ({ user, t }: { user: User; t: TranslateFn }) => (
  <div className="bg-gradient-to-br from-accent to-accent-dark rounded-xl p-6 text-white mb-6">
    <div className="flex items-center gap-4">
      <ProfilePhoto user={user} size="16" stack={false} />
      <div>
        <h2 className="text-xl font-semibold">
          {t('community_welcome_back')}, {user?.screenname || 'you'}!
        </h2>
        <p className="text-white/80 text-sm mt-1">
          {t('community_welcome_description')}
        </p>
      </div>
    </div>
  </div>
);

const QuickActions = ({ t }: { t: TranslateFn }) => (
  <div className="bg-white rounded-lg border border-line/20 p-4 mb-6">
    <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-3">
      {t('community_quick_actions')}
    </h3>
    <div className="grid grid-cols-2 gap-2">
      <Link
        href="/bookings/create"
        className="flex items-center gap-2 p-3 rounded-lg bg-neutral-light hover:bg-neutral transition-colors text-sm"
      >
        <span className="text-lg">🏠</span>
        <span>{t('community_action_book')}</span>
      </Link>
      <Link
        href="/events"
        className="flex items-center gap-2 p-3 rounded-lg bg-neutral-light hover:bg-neutral transition-colors text-sm"
      >
        <span className="text-lg">📅</span>
        <span>{t('community_action_events')}</span>
      </Link>
      <Link
        href="/volunteer"
        className="flex items-center gap-2 p-3 rounded-lg bg-neutral-light hover:bg-neutral transition-colors text-sm"
      >
        <span className="text-lg">🤝</span>
        <span>{t('community_action_volunteer')}</span>
      </Link>
      <Link
        href="/members"
        className="flex items-center gap-2 p-3 rounded-lg bg-neutral-light hover:bg-neutral transition-colors text-sm"
      >
        <span className="text-lg">👥</span>
        <span>{t('community_action_members')}</span>
      </Link>
    </div>
  </div>
);

const SidebarMemberPreview = ({ t }: { t: TranslateFn }) => (
  <div className="bg-white rounded-lg border border-line/20 p-4 mb-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">{t('community_sidebar_members')}</h3>
      <Link href="/members" className="text-sm text-accent hover:underline">
        {t('community_view_all')}
      </Link>
    </div>
    <MemberList list={true} preview={true} limit={5} />
  </div>
);

const SidebarEventsPreview = ({ t }: { t: TranslateFn }) => (
  <div className="bg-white rounded-lg border border-line/20 p-4">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">{t('community_sidebar_events')}</h3>
      <Link href="/events" className="text-sm text-accent hover:underline">
        {t('community_view_all')}
      </Link>
    </div>
    <UpcomingEvents list={true} card={true} limit={3} />
  </div>
);

const MemberHome = () => {
  const t = useTranslations() as TranslateFn;
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  if (isLoading || !user) {
    return (
      <main className="main-content w-full">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-neutral rounded-xl mb-6" />
            <div className="flex gap-8">
              <div className="flex-1 space-y-4">
                <div className="h-40 bg-neutral rounded-lg" />
                <div className="h-40 bg-neutral rounded-lg" />
              </div>
              <div className="hidden lg:block w-80 space-y-4">
                <div className="h-48 bg-neutral rounded-lg" />
                <div className="h-48 bg-neutral rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content w-full bg-neutral-light min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <WelcomeCard user={user} t={t} />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-line/20 overflow-hidden">
              <div className="flex items-center border-b border-line/20 px-2">
                <TabButton
                  active={activeTab === 'feed'}
                  onClick={() => setActiveTab('feed')}
                  icon={<FaHashtag className="w-4 h-4" />}
                  label={t('community_tab_feed')}
                />
                <TabButton
                  active={activeTab === 'members'}
                  onClick={() => setActiveTab('members')}
                  icon={<FaUsers className="w-4 h-4" />}
                  label={t('community_tab_members')}
                />
                <TabButton
                  active={activeTab === 'events'}
                  onClick={() => setActiveTab('events')}
                  icon={<FaCalendarAlt className="w-4 h-4" />}
                  label={t('community_tab_events')}
                />

                {user.roles?.includes('admin') && (
                  <Link
                    href="/channel/create"
                    className="ml-auto mr-4 text-sm text-accent hover:underline"
                  >
                    {t('member_home_add_channel')}
                  </Link>
                )}
              </div>

              <div className="p-4">
                {activeTab === 'feed' && (
                  <PostList channel={null} allowCreate showChannels />
                )}
                {activeTab === 'members' && (
                  <MemberList list={true} preview={true} limit={20} />
                )}
                {activeTab === 'events' && <UpcomingEvents list={true} limit={10} />}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <QuickActions t={t} />
              <SidebarMemberPreview t={t} />
              <SidebarEventsPreview t={t} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MemberHome;
