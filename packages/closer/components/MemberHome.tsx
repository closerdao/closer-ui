import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import models from '../models';
import { Channel } from '../types/channel';
import api, { formatSearch } from '../utils/api';
import ChannelList from './ChannelList';
import EditModel from './EditModel';
import OnGroundUsers from './OnGroundUsers';
import PostList from './PostList';
import ProfilePhoto from './ProfilePhoto';

type TranslateFn = (key: string) => string;

interface BookingConfig {
  enabled?: boolean;
}

interface MemberHomeProps {
  initialChannelSlug?: string | null;
  bookingConfig?: BookingConfig | null;
}

interface ChannelMember {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

const ChannelHeader = ({
  channel,
  members,
  onBack,
  isAdmin,
  t,
}: {
  channel: Channel;
  members: ChannelMember[];
  onBack: () => void;
  isAdmin: boolean;
  t: TranslateFn;
}) => (
  <div className="sticky top-0 z-10 border-b border-line/20 bg-white px-4 py-3 flex items-center gap-3">
    <button
      type="button"
      onClick={onBack}
      className="lg:hidden min-h-[44px] min-w-[44px] p-2 -ml-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
    >
      <ArrowLeft className="w-5 h-5 text-gray-600" />
    </button>

    <div className="flex-1 min-w-0">
      <h2 className="text-sm font-bold text-foreground truncate">
        {channel.name}
      </h2>
      <div className="flex items-center gap-2 mt-0.5">
        {members.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1.5">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m._id}
                  className="w-5 h-5 rounded-full overflow-hidden border border-white"
                >
                  <ProfilePhoto user={m} size="5" stack={false} />
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {members.length} {t('community_channel_members_count')}
            </span>
          </div>
        )}
      </div>
    </div>

    {isAdmin && (
      <Link
        href={`/edit-channel/${channel.slug}`}
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        {t('edit_channel_title')}
      </Link>
    )}
  </div>
);

const ChannelContentArea = ({
  channel,
  onBack,
  t,
}: {
  channel: Channel;
  onBack: () => void;
  t: TranslateFn;
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<ChannelMember[]>([]);

  const isAdmin =
    user?.roles?.includes('admin') || channel.createdBy === user?._id;

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ viewChannels: channel._id }),
            sort_by: '-created',
            limit: 20,
          },
        });
        setMembers(data.results || []);
      } catch (err) {
        console.error('Load members error', err);
      }
    };

    loadMembers();
  }, [channel._id]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ChannelHeader
        channel={channel}
        members={members}
        onBack={onBack}
        isAdmin={!!isAdmin}
        t={t}
      />

      {channel.description && (
        <div className="px-4 py-2 bg-neutral-light/50 border-b border-line/10">
          <p className="text-xs text-gray-500">{channel.description}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <PostList allowCreate parentType="channel" channel={channel._id} />
      </div>
    </div>
  );
};

const EmptyContentArea = ({ t }: { t: TranslateFn }) => (
  <div className="flex-1 flex items-center justify-center bg-neutral-light/30">
    <div className="text-center px-6">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/5 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 text-accent/40" />
      </div>
      <h3 className="text-base font-semibold text-gray-400 mb-1">
        {t('community_select_channel')}
      </h3>
      <p className="text-sm text-gray-400">
        {t('community_select_channel_description')}
      </p>
    </div>
  </div>
);

const CreateChannelModal = ({
  isOpen,
  onClose,
  onCreated,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
  t: TranslateFn;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line/20">
          <h2 className="text-lg font-bold text-foreground">
            {t('channel_create_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-light transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <EditModel
            endpoint="/channel"
            fields={models.channel}
            onSave={(channel) => {
              onCreated(channel);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

const MemberHome = ({
  initialChannelSlug,
  bookingConfig,
}: MemberHomeProps) => {
  const t = useTranslations() as TranslateFn;
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [mobileShowContent, setMobileShowContent] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [channelListKey, setChannelListKey] = useState(0);

  const currentSlug =
    (router.query.channel as string) || initialChannelSlug || null;

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setMobileShowContent(true);
    router.push(
      { pathname: '/community', query: { channel: channel.slug } },
      undefined,
      { shallow: true },
    );
  };

  const handleBack = () => {
    setMobileShowContent(false);
    router.push('/community', undefined, { shallow: true });
  };

  const handleChannelCreated = (channel: Channel) => {
    setChannelListKey((k) => k + 1);
    handleSelectChannel(channel);
  };

  if (isLoading || !user) {
    return (
      <main className="main-content w-full">
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-80 border-r border-line/20 bg-white animate-pulse">
            <div className="p-4 border-b border-line/20">
              <div className="h-6 bg-neutral rounded w-1/2" />
            </div>
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-neutral rounded-full" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-neutral rounded w-2/3 mb-1.5" />
                    <div className="h-3 bg-neutral rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-neutral-light/30" />
        </div>
      </main>
    );
  }

  return (
    <main className="main-content w-full pb-16 lg:pb-0">
      <div className="flex h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
        <div
          className={`w-full lg:w-80 lg:flex-shrink-0 border-r border-line/20 bg-white flex flex-col ${
            mobileShowContent ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-line/20 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-accent" />
              <h1 className="text-base font-bold text-foreground">
                {t('community_title')}
              </h1>
            </div>
            {user.roles?.includes('admin') && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg hover:bg-neutral-light transition-colors flex items-center justify-center"
                title={t('member_home_add_channel')}
              >
                <Plus className="w-5 h-5 text-accent" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <ChannelList
              key={channelListKey}
              onSelectChannel={handleSelectChannel}
              selectedChannelId={selectedChannel?._id}
              initialSlug={currentSlug}
            />
          </div>

          <OnGroundUsers bookingConfig={bookingConfig} />

          <div className="border-t border-line/20 p-3 flex-shrink-0">
            <Link
              href="/members"
              className="flex items-center gap-2 min-h-[44px] px-3 py-3 rounded-lg hover:bg-neutral-light transition-colors text-sm text-gray-600"
            >
              <Users className="w-4 h-4" />
              <span>{t('community_browse_members')}</span>
            </Link>
          </div>
        </div>

        <div
          className={`flex-1 flex flex-col bg-white min-w-0 min-h-0 ${
            mobileShowContent ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {selectedChannel ? (
            <ChannelContentArea
              channel={selectedChannel}
              onBack={handleBack}
              t={t}
            />
          ) : (
            <EmptyContentArea t={t} />
          )}
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-line/20 bg-white flex z-20 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setMobileShowContent(false)}
          className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 text-sm transition-colors ${
            !mobileShowContent
              ? 'text-accent font-medium'
              : 'text-gray-500'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {t('community_title')}
        </button>
        <Link
          href="/members"
          className={`flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 text-sm transition-colors ${
            'text-gray-500'
          }`}
        >
          <Users className="w-4 h-4" />
          {t('community_browse_members')}
        </Link>
      </div>

      <CreateChannelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleChannelCreated}
        t={t}
      />
    </main>
  );
};

export default MemberHome;
