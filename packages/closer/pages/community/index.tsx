import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import dayjs from 'dayjs';
import { UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import BookingsSearchBar from '../../components/BookingsSearchBar';
import NearbyMembers from '../../components/NearbyMembers';
import ProfilePhoto from '../../components/ProfilePhoto';
import SubscriptionBadge from '../../components/SubscriptionBadge';
import { Card, Spinner } from '../../components/ui';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { CitizenshipConfig } from '../../types/api';
import api, { formatSearch } from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import config from '../../configCached';
import { parseMessageFromError } from '../../utils/common';

const FRIENDS_PAGE_SIZE = 30;
const CITIZENS_LIMIT = 100;

const escapeRegex = (term: string) =>
  term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface OnSiteUser {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

interface Props {
  bookingConfig: { enabled?: boolean } | null;
}

const CommunityPage = ({ bookingConfig }: Props) => {
  const t = useTranslations();
  const { PLATFORM_NAME } = useConfig();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { platform } = usePlatform() as any;

  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;
  const isCitizenshipEnabled = Boolean(citizenshipConfig?.enabled);
  const isBookingEnabled =
    bookingConfig?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const [search, setSearch] = useState('');
  const [friendsLimit, setFriendsLimit] = useState(FRIENDS_PAGE_SIZE);
  const [onSiteUsers, setOnSiteUsers] = useState<OnSiteUser[]>([]);
  const [onSiteIds, setOnSiteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchWhere = useMemo(
    () =>
      search.trim()
        ? { screenname: { $regex: escapeRegex(search.trim()), $options: 'i' } }
        : {},
    [search],
  );

  // Citizens hold the 'member' role (the same filter the old /members page
  // used); everyone else is a friend of the platform. With citizenship
  // disabled there is no citizens section and the friends list is everyone.
  const citizensParams = useMemo(
    () => ({
      where: { roles: 'member', ...searchWhere },
      sort_by: '-lastactive',
      limit: CITIZENS_LIMIT,
    }),
    [searchWhere],
  );
  const friendsParams = useMemo(
    () => ({
      where: {
        ...(isCitizenshipEnabled && { roles: { $ne: 'member' } }),
        ...searchWhere,
      },
      sort_by: '-lastactive',
      limit: friendsLimit,
    }),
    [searchWhere, friendsLimit, isCitizenshipEnabled],
  );

  const citizens = isCitizenshipEnabled
    ? platform.user.find(citizensParams)
    : null;
  const citizensCount = isCitizenshipEnabled
    ? platform.user.findCount(citizensParams)
    : 0;
  const friends = platform.user.find(friendsParams);
  const friendsCount = platform.user.findCount(friendsParams);

  const loadDirectory = async () => {
    try {
      setError(null);
      await Promise.all([
        ...(isCitizenshipEnabled
          ? [
              platform.user.get(citizensParams),
              platform.user.getCount(citizensParams),
            ]
          : []),
        platform.user.get(friendsParams),
        platform.user.getCount(friendsParams),
      ]);
    } catch (err: unknown) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, [citizensParams, friendsParams]);

  // Who is physically at the platform right now: guests of paid stays whose
  // dates span today (same criterion as the OnGroundUsers strip).
  useEffect(() => {
    if (!isBookingEnabled || !platform?.booking || !isAuthenticated) return;

    const load = async () => {
      try {
        const now = new Date();
        const result = await platform.booking.get({
          where: {
            status: { $in: ['paid', 'checked-in'] },
            start: { $lte: now },
            end: { $gte: now },
          },
          limit: 500,
        });
        const bookings = result?.results?.toJS?.() ?? result?.results ?? [];
        const userIds = new Set<string>();
        bookings.forEach((booking: any) => {
          if (booking?.createdBy) userIds.add(booking.createdBy);
          if (booking?.paidBy) userIds.add(booking.paidBy);
        });
        setOnSiteIds(userIds);
        if (userIds.size === 0) {
          setOnSiteUsers([]);
          return;
        }
        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ _id: { $in: Array.from(userIds) } }),
            limit: userIds.size,
          },
        });
        setOnSiteUsers(data?.results ?? []);
      } catch {
        setOnSiteUsers([]);
        setOnSiteIds(new Set());
      }
    };

    load();
  }, [isBookingEnabled, platform, isAuthenticated]);

  const hereBadge = (userId: string) =>
    onSiteIds.has(userId) && (
      <span className="inline-flex items-center gap-1 text-xs text-success font-semibold shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="sm:hidden">{t('community_here_badge')}</span>
        <span className="hidden sm:inline">
          {t('community_at_platform_badge', { platform: PLATFORM_NAME })}
        </span>
      </span>
    );

  return (
    <>
      <Head>
        <title>{`${t('community_humans_of', { platform: PLATFORM_NAME })}`}</title>
        <meta name="description" content={t('community_meta_description')} />
        <meta
          property="og:title"
          content={t('community_humans_of', { platform: PLATFORM_NAME })}
        />
        <meta
          property="og:description"
          content={t('community_meta_description')}
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="w-full min-w-0 overflow-x-hidden">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 md:gap-16 pb-24">
          <div className="min-w-0">
            <h1 className="font-extrabold text-3xl md:text-4xl break-words">
              {t('community_humans_of', { platform: PLATFORM_NAME })}
            </h1>
            {onSiteUsers.length > 0 && (
              <p className="text-sm mt-2">
                <span className="text-success font-medium">
                  {t('community_on_site_now', {
                    count: onSiteUsers.length,
                    platform: PLATFORM_NAME,
                  })}
                </span>
              </p>
            )}
          </div>

          <NearbyMembers />

          <div className="w-full max-w-sm">
            <BookingsSearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setFriendsLimit(FRIENDS_PAGE_SIZE);
              }}
              placeholder={t('community_search_placeholder')}
              inputClassName="rounded-full pl-4"
            />
          </div>

          {onSiteUsers.length > 0 && (
            <section className="min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="font-bold text-lg break-words">
                  {t('community_at_platform', { platform: PLATFORM_NAME })}
                </h2>
                <span className="text-sm text-gray-400 shrink-0">
                  {onSiteUsers.length}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-4">
                {onSiteUsers.map((user) => (
                  <Link
                    key={user._id}
                    href={`/members/${user.slug}`}
                    className="flex items-center gap-3 group min-w-0 max-w-full"
                  >
                    <ProfilePhoto user={user} size="10" stack={false} />
                    <span className="text-sm font-semibold group-hover:text-accent truncate">
                      {user.screenname}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {error && <p className="validation-error">{error}</p>}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Spinner /> {t('generic_loading')}
            </div>
          )}

          {isCitizenshipEnabled && citizens && citizens.count() > 0 && (
            <section className="min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="font-bold text-lg">
                  {t('community_citizens_title')}
                </h2>
                <span className="text-sm text-gray-400 sm:text-right">
                  {citizensCount || citizens.count()} ·{' '}
                  {t('community_citizens_subtitle', {
                    platform: PLATFORM_NAME,
                  })}
                </span>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {citizens.map((row: any) => {
                  const citizen = row.toJS();
                  const isMe = citizen._id === currentUser?._id;
                  const skills = (citizen.preferences?.skills || [])
                    .filter(Boolean)
                    .slice(0, 4);
                  const dream = citizen.preferences?.dream;
                  const superpower = citizen.preferences?.superpower;
                  const vouchCount = citizen.vouched?.length || 0;
                  return (
                    <Card
                      key={citizen._id}
                      className="justify-start gap-3 min-w-0 overflow-hidden"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <Link
                          href={`/members/${citizen.slug}`}
                          className="shrink-0"
                        >
                          <ProfilePhoto
                            user={citizen}
                            size="16"
                            stack={false}
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-lg leading-tight">
                            <Link
                              href={`/members/${citizen.slug}`}
                              className="hover:text-accent break-words"
                            >
                              {citizen.screenname}
                            </Link>
                            <SubscriptionBadge
                              subscription={citizen.subscription}
                            />
                            {hereBadge(citizen._id)}
                          </div>
                          {citizen.tagline && (
                            <p className="text-sm text-gray-500 truncate">
                              {citizen.tagline}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span>
                              {t('community_joined', {
                                date: dayjs(citizen.created).format(
                                  'MMM YYYY',
                                ),
                              })}
                            </span>
                            {vouchCount > 0 && (
                              <span
                                className="inline-flex items-center gap-1 text-success"
                                title={t('manage_users_vouches')}
                              >
                                <UserCheck className="w-3 h-3" />
                                {vouchCount}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {citizen.about && (
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {citizen.about}
                        </p>
                      )}
                      {(dream || superpower) && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          <span className="font-semibold text-gray-600">
                            {dream
                              ? t('community_citizen_dream_label')
                              : t('community_citizen_superpower_label')}
                            :
                          </span>{' '}
                          {dream || superpower}
                        </p>
                      )}
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((skill: string) => (
                            <span
                              key={skill}
                              className="text-xs text-gray-600 bg-neutral-light rounded-full px-2.5 py-0.5"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        href={`/members/${citizen.slug}`}
                        className="text-sm text-accent font-semibold hover:underline mt-auto"
                      >
                        {isMe
                          ? t('community_edit_profile')
                          : `${t('community_say_hi')} →`}
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {friends && friends.count() > 0 && (
            <section className="min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h2 className="font-bold text-lg break-words">
                  {isCitizenshipEnabled
                    ? t('community_friends_title', { platform: PLATFORM_NAME })
                    : t('community_members_title')}
                </h2>
                <span className="text-sm text-gray-400 shrink-0">
                  {friendsCount}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((row: any) => {
                  const friend = row.toJS();
                  const detail = friend.tagline || friend.about;
                  const vouchCount = friend.vouched?.length || 0;
                  return (
                    <Link key={friend._id} href={`/members/${friend.slug}`}>
                      <Card className="h-full justify-start gap-2 py-3 hover:shadow-2xl transition-shadow min-w-0 overflow-hidden">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="shrink-0">
                            <ProfilePhoto
                              user={friend}
                              size="12"
                              stack={false}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                              <p className="text-sm font-semibold truncate max-w-full">
                                {friend.screenname}
                              </p>
                              <SubscriptionBadge
                                subscription={friend.subscription}
                              />
                              {hereBadge(friend._id)}
                            </div>
                            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>
                                {t('community_joined', {
                                  date: dayjs(friend.created).format(
                                    'MMM YYYY',
                                  ),
                                })}
                              </span>
                              {vouchCount > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 text-success"
                                  title={t('manage_users_vouches')}
                                >
                                  <UserCheck className="w-3 h-3" />
                                  {vouchCount}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {detail && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {detail}
                          </p>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
              {friendsCount > friendsLimit && (
                <button
                  onClick={() =>
                    setFriendsLimit(friendsLimit + FRIENDS_PAGE_SIZE)
                  }
                  className="mt-6 text-sm text-accent font-semibold hover:underline"
                >
                  {t('community_load_more')}
                </button>
              )}
            </section>
          )}

          {!isLoading &&
            !error &&
            (!friends || friends.count() === 0) &&
            (!citizens || citizens.count() === 0) && (
              <p className="text-sm text-gray-500">
                {t('community_no_results')}
              </p>
            )}

          {isCitizenshipEnabled &&
            !currentUser?.roles?.includes('member') && (
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row sm:flex-wrap sm:justify-between gap-4 text-sm text-gray-500">
                <span className="min-w-0">
                  {t('community_footer_note', { platform: PLATFORM_NAME })}
                </span>
                <Link
                  href="/citizenship"
                  className="text-accent font-semibold hover:underline shrink-0"
                >
                  {t('community_become_citizen')} →
                </Link>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

CommunityPage.getInitialProps = async (context: NextPageContext) => {
  try {
    return { bookingConfig: config.booking || null };
  } catch (err: unknown) {
    return { bookingConfig: config.booking };
  }
};

export default CommunityPage;
