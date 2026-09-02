import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useMemo, useState } from 'react';

import AmbassadorBadge from '../../components/AmbassadorBadge';
import EventsList from '../../components/EventsList';
import Modal from '../../components/Modal';
import {
  ProfileHomes,
  ProfileUpcomingVisits,
} from '../../components/ProfilePlaces';
import RoleTag, { getRoleTagKey } from '../../components/RoleTag';
import SubscriptionBadge from '../../components/SubscriptionBadge';
import UploadPhoto from '../../components/UploadPhoto';
import UserAvatarPlaceholder from '../../components/UserAvatarPlaceholder';
import UserBookings from '../../components/UserBookings';
import VillageCard from '../../components/VillageCard';
import Vouching from '../../components/Vouching';
import EmailDisplay from '../../components/display/emailDisplay';
import WalletDisplay from '../../components/display/walletDisplay';
import { Card } from '../../components/ui';
import Button from '../../components/ui/Button';
import Heading from '../../components/ui/Heading';

import {
  Facebook,
  Github,
  Instagram,
  Link as LinkIcon,
  Linkedin,
  Music,
  Trash2,
  Twitter,
  Youtube,
} from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../configCached';
import { useAuth } from '../../contexts/auth';
import { User, UserLink } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { useAttendedEvents } from '../../hooks/useAttendedEvents';
import { BookingConfig } from '../../types/api';
import {
  CitizenshipConfig,
  CohousingConfig,
  GeneralConfig,
} from '../../types/api';
import { UpcomingVisit, UserHome } from '../../types/userPlaces';
import api, { cdn } from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { getUrlDisplayString } from '../../utils/display.helpers';
import { mergeUserSettings } from '../../utils/userSettings.helpers';
import {
  VillageConnection,
  fetchUserVillageConnections,
} from '../../utils/village.utils';
import PageNotFound from '../not-found';

const isWalletEnabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

const ConnectedWallet = isWalletEnabled
  ? dynamic(
      () => import('../../components/ConnectedWallet').then((m) => m.default),
      { ssr: false },
    )
  : () => null;

/** Stamps are small, so the whole attendance history fits without paging. */
const MAX_ATTENDED_EVENTS_TO_SHOW = 200;

/** Roles that may read a member's contact details on their profile. */
const STAFF_INFO_ROLES = ['space-host', 'team', 'admin'];

const isFederationEnabled =
  process.env.NEXT_PUBLIC_FEATURE_FEDERATION === 'true';

interface MemberPageProps {
  member: User;
  /** The member who introduced them — resolved server-side from `referredBy`. */
  referrer: Pick<User, '_id' | 'slug' | 'screenname'> | null;
  loadError: string;
  bookingConfig: BookingConfig | null;
}

const MemberPage = ({
  member,
  referrer,
  loadError,
  bookingConfig,
}: MemberPageProps) => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const citizenshipConfig = getCachedConfig(
    'citizenship',
  ) as CitizenshipConfig | null;
  const cohousingConfig = getCachedConfig(
    'cohousing',
  ) as CohousingConfig | null;
  const eventsConfig = getCachedConfig('events') as {
    enabled?: boolean;
  } | null;

  // Same config + env-flag pairs the menus gate on (memberMenuFeatureFlags).
  const isBookingEnabled =
    Boolean(bookingConfig?.enabled) &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';
  const isCitizenshipEnabled =
    Boolean(citizenshipConfig?.enabled) &&
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true';
  const isEventsEnabled = eventsConfig?.enabled === true;
  // Vouches feed citizen eligibility and cohousing applications; without
  // either feature the section has no purpose.
  const isVouchingEnabled =
    isCitizenshipEnabled || cohousingConfig?.enabled === true;

  const t = useTranslations();
  const {
    user: currentUser,
    isAuthenticated,
    refetchUser,
    isLoading,
  } = useAuth();

  const { platform }: any = usePlatform();
  const isMember = currentUser?.roles.includes('member');
  const isAdmin = currentUser?.roles.includes('admin');
  const isSpaceHost = currentUser?.roles.includes('space-host');
  const isOwnProfile = currentUser?._id === member?._id;
  // Contact details are a staff view, not a public one — the roles that open
  // it are named on the section itself so the reader knows which of their hats
  // they are wearing, and that the member does not see this.
  const staffInfoRoles = useMemo(
    () =>
      (currentUser?.roles || []).filter((role) =>
        STAFF_INFO_ROLES.includes(role),
      ),
    [currentUser?.roles],
  );

  const router = useRouter();
  const [introMessage, setMessage] = useState('');
  const [openIntro, setOpenIntro] = useState(false);
  const [error, setErrors] = useState<string | null>(null);
  const [sendError, setSendErrors] = useState<string | false>(false);
  const [links, setLinks] = useState<UserLink[]>(member?.links || []);
  const [showForm, toggleShowForm] = useState(false);
  const [formValues, setFormValues] = useState({
    twitter: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    github: '',
    youtube: '',
    website: '',
  });
  const [hasSaved, setHasSaved] = useState(false);
  const [openReportForm, setOpenReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isUnsafe, setIsUnsafe] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [deleteReportSuccess, setDeleteReportSuccess] = useState(false);
  const [villageConnections, setVillageConnections] = useState<
    VillageConnection[]
  >([]);
  const [about, setAbout] = useState<string>(member?.about || '');
  const [aboutDraft, setAboutDraft] = useState<string>(member?.about || '');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [homes, setHomes] = useState<UserHome[]>(member?.settings?.homes || []);
  const [upcomingVisits, setUpcomingVisits] = useState<UpcomingVisit[]>(
    member?.settings?.upcomingVisits || [],
  );

  // Affiliates wear the ambassador chip without carrying the role, so they get
  // an unlinked one — the rest of the row filters the member list by role.
  const isAffiliateOnly = Boolean(
    member?.affiliate && !member?.roles?.includes('ambassador'),
  );

  // `member` and `citizen` render as the same tag, so keep one of each and let
  // ambassador lead — it is the standing people look for first.
  const rolesToShow = useMemo(() => {
    const seen = new Set<string>();
    return (member?.roles || [])
      .filter((role) => {
        const key = getRoleTagKey(role);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Number(b === 'ambassador') - Number(a === 'ambassador'));
  }, [member?.roles]);

  // Passing no id keeps the hook from fetching when events are disabled.
  const { eventIds: attendedEventIds } = useAttendedEvents(
    isEventsEnabled ? member?._id : undefined,
  );

  // Pinned on mount: a fresh `new Date()` per render would change the query on
  // every pass and refetch the same events.
  const [pastEventsCutoff] = useState(() => new Date());

  // Attendance is recorded either on the event (RSVPs) or on the member's
  // bookings and tickets, so the stamps are the union of both.
  const pastEventsWhere = useMemo(() => {
    const attendanceClauses: Record<string, unknown>[] = [
      { attendees: member?._id },
    ];
    if (attendedEventIds.length) {
      attendanceClauses.push({ _id: { $in: attendedEventIds } });
    }

    return {
      $or: attendanceClauses,
      visibility: 'public',
      end: { $lt: pastEventsCutoff },
    };
  }, [member?._id, attendedEventIds, pastEventsCutoff]);

  // Re-sync profile fields when navigating between member profiles.
  // This page uses getInitialProps and stays mounted across
  // /members/[slug] -> /members/[slug] client-side navigations, so the
  // useState initializers only run once. Without this, About and places would
  // keep showing the previously viewed member's data.
  useEffect(() => {
    setAbout(member?.about || '');
    setAboutDraft(member?.about || '');
    setHomes(member?.settings?.homes || []);
    setUpcomingVisits(member?.settings?.upcomingVisits || []);
  }, [member?._id]);

  // Federation profiles list the villages this member is tied to — as
  // ambassador, manager, creator or referrer. Reset on navigation for the same
  // reason as the About re-sync above.
  useEffect(() => {
    setVillageConnections([]);
    if (!isFederationEnabled || !member?._id) return;
    let cancelled = false;
    (async () => {
      const connections = await fetchUserVillageConnections(member._id);
      if (!cancelled) setVillageConnections(connections);
    })();
    return () => {
      cancelled = true;
    };
  }, [member?._id]);

  useEffect(() => {
    if (hasSaved) {
      setTimeout(() => {
        if (setHasSaved) {
          setHasSaved(false);
        }
      }, 2000);
    }
    refetchUser();
  }, [hasSaved]);

  const saveAbout = async () => {
    try {
      setIsSavingAbout(true);
      setAboutError(null);
      // platform patch never rejects — a failed request comes back as a
      // PATCH_ERROR action carrying the axios error, so check for it here.
      const action = await platform.user.patch(currentUser?._id, {
        about: aboutDraft,
      });
      if (action?.error) {
        setAboutError(parseMessageFromError(action.error));
        return;
      }
      setAbout(aboutDraft);
      setIsEditingAbout(false);
      await refetchUser();
    } catch (err: unknown) {
      setAboutError(parseMessageFromError(err));
    } finally {
      setIsSavingAbout(false);
    }
  };

  const saveHomes = async (nextHomes: UserHome[]) => {
    const action = await platform.user.patch(currentUser?._id, {
      settings: mergeUserSettings(currentUser, { homes: nextHomes }),
    });
    if (action?.error) {
      throw action.error;
    }
    setHomes(nextHomes);
    await refetchUser();
  };

  const saveUpcomingVisits = async (nextVisits: UpcomingVisit[]) => {
    const action = await platform.user.patch(currentUser?._id, {
      settings: mergeUserSettings(currentUser, { upcomingVisits: nextVisits }),
    });
    if (action?.error) {
      throw action.error;
    }
    setUpcomingVisits(nextVisits);
    await refetchUser();
  };

  const deleteLink = async (link: UserLink) => {
    try {
      const { data } = await platform.user.patch(currentUser?._id, {
        links: links.filter((item) => item.name !== link.name),
      });
      setLinks(data.links);
      setErrors(null);
    } catch (err: unknown) {
      const error = parseMessageFromError(err);
      setErrors(error);
    }
  };

  const sendMessage = async (content: string) => {
    try {
      setSendErrors(false);
      await api.post('/message', { content, visibleBy: [member._id] });
      setOpenIntro(false);
    } catch (err: unknown) {
      const error = parseMessageFromError(err);
      setSendErrors(error);
    }
  };

  const checkIfReported = async () => {
    try {
      // The endpoint answers with `{ results: { reported: boolean } }` — the
      // envelope itself is always truthy, so read the flag inside it.
      const { data } = await api.get(`/report/user/${member._id}`);
      setHasReported(Boolean(data?.results?.reported));
    } catch (err) {
      console.error('Error checking if user is reported:', err);
    }
  };

  const reportUser = async () => {
    try {
      setReportSuccess(false);
      setErrors(null);
      await api.post(`/report/user/${member._id}`, {
        reason: reportReason,
        unsafe: isUnsafe,
      });
      setReportSuccess(true);
      setHasReported(true);
      setTimeout(() => {
        setOpenReportForm(false);
      }, 2000);
    } catch (err: unknown) {
      const error = parseMessageFromError(err);
      setErrors(error);
    }
  };

  const deleteReport = async () => {
    try {
      setDeleteReportSuccess(false);
      setErrors(null);
      await api.delete(`/report/user/${member._id}`);
      setDeleteReportSuccess(true);
      setHasReported(false);
    } catch (err: unknown) {
      const error = parseMessageFromError(err);
      setErrors(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && member?._id !== currentUser?._id) {
      checkIfReported();
    }
  }, [member?._id, currentUser?._id, isAuthenticated]);

  if (loadError) {
    return <PageNotFound error={loadError} />;
  }

  if (!member) {
    return <PageNotFound error={error || undefined} />;
  }

  return (
    <>
      <Head>
        <title>{member.screenname}</title>
      </Head>
      <div className="main-content w-full flex flex-col items-center">
        {openIntro && (
          <>
            <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline">
              <div className="relative w-11/12 my-6 mx-auto max-w-3xl">
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col space-x-5 w-full bg-background outline-none focus:outline-none p-10">
                  {sendError && (
                    <p className="validation-error">
                      {t('members_slug_error')} {sendError}
                    </p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage(introMessage);
                    }}
                  >
                    <label>
                      {t('members_slug_contact')} {member.screenname}
                    </label>
                    <textarea
                      placeholder={t('members_slug_message_placeholder')}
                      onChange={(e) => {
                        setMessage(e.target.value);
                      }}
                      value={introMessage}
                      className="w-full h-32"
                    />
                    <button type="submit" className="btn-primary mt-8 mr-2">
                      {t('members_slug_send')}
                    </button>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenIntro(false);
                      }}
                    >
                      {t('members_slug_cancel')}
                    </a>
                  </form>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        )}

        <div className="flex flex-col items-center max-w-6xl w-full mx-auto px-4 md:px-6">
          <div className="w-full md:mt-8 mb-12">
            {/* Profile Header Section */}
            <section className="w-full bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                {/* Profile Photo */}
                <div className="flex justify-center md:justify-start">
                  <div className="group relative">
                    {isAuthenticated && member?._id === currentUser?._id ? (
                      <UploadPhoto
                        model="user"
                        id={member._id}
                        onSave={() => {
                          router.push(router.asPath);
                        }}
                        label={
                          member.photo
                            ? t('members_slug_change_photo')
                            : t('members_slug_add_photo')
                        }
                      />
                    ) : member?.photo ? (
                      <img
                        src={`${cdn}${member.photo}-profile-lg.jpg`}
                        loading="lazy"
                        alt={member.screenname}
                        className="peer w-36 md:w-48 rounded-full border-4 border-white shadow-md"
                      />
                    ) : (
                      <UserAvatarPlaceholder size="4xl" />
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col flex-grow md:ml-4">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h3 className="font-medium text-4xl md:text-5xl text-center md:text-left">
                      {member.screenname}
                      <SubscriptionBadge
                        subscription={member?.subscription}
                        size="large"
                      />
                    </h3>
                  </div>

                  {/* Roles Tags */}
                  {(rolesToShow.length > 0 || isAffiliateOnly) && (
                    <div className="mt-3 mb-4">
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {isAffiliateOnly && <AmbassadorBadge />}
                        {rolesToShow.map((role) => (
                          <Link
                            as={`/members?role=${encodeURIComponent(role)}`}
                            href="/members"
                            key={role}
                            className="rounded-full transition-opacity hover:opacity-75"
                          >
                            <RoleTag role={role} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Who introduced them — the referral chain is public, it is
                      how members place each other in the network. */}
                  {referrer?.slug && (
                    <p className="text-sm text-gray-500 text-center md:text-left mb-2">
                      {t('members_slug_introduced_by')}{' '}
                      <Link
                        href={`/members/${referrer.slug}`}
                        className="text-accent hover:underline"
                      >
                        {referrer.screenname}
                      </Link>
                    </p>
                  )}

                  {/* Action Buttons */}
                  {isAuthenticated && member?._id !== currentUser?._id && (
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenIntro(!openIntro);
                        }}
                        className="btn-primary px-4 py-2"
                      >
                        {t('members_slug_get_introduced')}
                      </a>
                      {hasReported ? (
                        <button
                          onClick={deleteReport}
                          className="btn px-4 py-2"
                        >
                          {t('report_user_delete')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setOpenReportForm(true)}
                          className="btn px-4 py-2"
                        >
                          {t('report_user_button')}
                        </button>
                      )}
                      {deleteReportSuccess && (
                        <span className="ml-2 text-green-600">
                          {t('report_user_delete_success')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Content Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column - User Info */}
              <div className="md:col-span-1">
                {/* Connected Wallet Section */}
                {isWalletEnabled &&
                  isAuthenticated &&
                  member?._id === currentUser?._id && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                      <h4 className="font-medium text-xl mb-4">
                        {t('members_slug_wallet')}
                      </h4>
                      <ConnectedWallet />
                    </div>
                  )}

                {/* Social Links Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-xl">
                      {t('members_slug_stay_social')}
                    </h4>
                    {isAuthenticated && member?._id === currentUser?._id && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Extract usernames from existing links
                          const extractUsername = (
                            url: string,
                            pattern: RegExp,
                          ) => {
                            const match = url.match(pattern);
                            return match ? match[1] : '';
                          };

                          const newFormValues = {
                            twitter: '',
                            instagram: '',
                            linkedin: '',
                            facebook: '',
                            github: '',
                            youtube: '',
                            website: '',
                          };

                          links.forEach((link) => {
                            const url = link.url.toLowerCase();
                            if (
                              url.includes('twitter.com/') ||
                              url.includes('x.com/')
                            ) {
                              newFormValues.twitter = extractUsername(
                                url,
                                /(?:twitter\.com\/|x\.com\/)([^/?]+)/,
                              );
                            } else if (url.includes('instagram.com/')) {
                              newFormValues.instagram = extractUsername(
                                url,
                                /instagram\.com\/([^/?]+)/,
                              );
                            } else if (url.includes('linkedin.com/in/')) {
                              newFormValues.linkedin = extractUsername(
                                url,
                                /linkedin\.com\/in\/([^/?]+)/,
                              );
                            } else if (url.includes('facebook.com/')) {
                              newFormValues.facebook = extractUsername(
                                url,
                                /facebook\.com\/([^/?]+)/,
                              );
                            } else if (url.includes('github.com/')) {
                              newFormValues.github = extractUsername(
                                url,
                                /github\.com\/([^/?]+)/,
                              );
                            } else if (
                              url.includes('youtube.com/c/') ||
                              url.includes('youtube.com/@')
                            ) {
                              newFormValues.youtube = extractUsername(
                                url,
                                /youtube\.com\/(?:c\/|@)([^/?]+)/,
                              );
                            } else if (
                              !url.includes('twitter.com') &&
                              !url.includes('x.com') &&
                              !url.includes('instagram.com') &&
                              !url.includes('linkedin.com') &&
                              !url.includes('facebook.com') &&
                              !url.includes('github.com') &&
                              !url.includes('youtube.com') &&
                              !url.includes('tiktok.com')
                            ) {
                              // Only set website if it's not already set (to avoid overwriting)
                              if (!newFormValues.website) {
                                newFormValues.website = link.url;
                              }
                            }
                          });

                          setFormValues(newFormValues);
                          toggleShowForm(!showForm);
                        }}
                        className="btn-small"
                      >
                        {t('members_slug_socials_edit')}
                      </button>
                    )}
                  </div>

                  <ul className="flex flex-col w-full space-y-2">
                    {links && links.length > 0 ? (
                      links.map((link) => {
                        // Determine icon based on URL or name
                        let IconComponent: React.ComponentType<{
                          className?: string;
                        }> = LinkIcon;
                        let networkName = link.name;

                        if (
                          link.url.includes('twitter.com') ||
                          link.url.includes('x.com') ||
                          link.name.toLowerCase().includes('twitter') ||
                          link.name.toLowerCase().includes('x')
                        ) {
                          IconComponent = Twitter;
                          networkName = networkName || 'Twitter/X';
                        } else if (
                          link.url.includes('instagram.com') ||
                          link.name.toLowerCase().includes('instagram')
                        ) {
                          IconComponent = Instagram;
                          networkName = networkName || 'Instagram';
                        } else if (
                          link.url.includes('facebook.com') ||
                          link.name.toLowerCase().includes('facebook')
                        ) {
                          IconComponent = Facebook;
                          networkName = networkName || 'Facebook';
                        } else if (
                          link.url.includes('linkedin.com') ||
                          link.name.toLowerCase().includes('linkedin')
                        ) {
                          IconComponent = Linkedin;
                          networkName = networkName || 'LinkedIn';
                        } else if (
                          link.url.includes('github.com') ||
                          link.name.toLowerCase().includes('github')
                        ) {
                          IconComponent = Github;
                          networkName = networkName || 'GitHub';
                        } else if (
                          link.url.includes('youtube.com') ||
                          link.name.toLowerCase().includes('youtube')
                        ) {
                          IconComponent = Youtube;
                          networkName = networkName || 'YouTube';
                        } else if (
                          link.url.includes('tiktok.com') ||
                          link.name.toLowerCase().includes('tiktok')
                        ) {
                          IconComponent = Music;
                          networkName = networkName || 'TikTok';
                        }

                        return (
                          <li
                            key={link._id}
                            className="group flex min-w-0 flex-row items-center justify-between gap-2 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                <IconComponent className="h-4 w-4 text-gray-700" />
                              </span>
                              <a
                                href={link.url}
                                className="min-w-0 flex-1 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="block truncate font-medium">
                                  {networkName}
                                </span>
                                <span
                                  className="block truncate text-xs text-gray-500"
                                  title={link.url}
                                >
                                  {getUrlDisplayString(link.url)}
                                </span>
                              </a>
                            </div>
                            {isAuthenticated &&
                              member?._id === currentUser?._id && (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    deleteLink(link);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="text-gray-500 w-5 h-5 hover:text-red-500" />
                                </a>
                              )}
                          </li>
                        );
                      })
                    ) : (
                      <li className="text-gray-500 italic">
                        {t('members_slug_no_social_links')}
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Right Column - Main Content */}
              <div className="md:col-span-2">
                {/* About Section — hidden entirely for other people's empty
                    profiles, but an obvious prompt to fill in on your own. */}
                {(about || isOwnProfile) && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-xl">
                        {t('members_slug_about')}
                      </h4>
                      {isOwnProfile && about && !isEditingAbout && (
                        <button
                          onClick={() => {
                            setAboutDraft(about);
                            setAboutError(null);
                            setIsEditingAbout(true);
                          }}
                          className="text-sm text-accent hover:underline"
                        >
                          {t('members_slug_edit')}
                        </button>
                      )}
                    </div>

                    {isEditingAbout ? (
                      <div className="flex flex-col gap-3">
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-accent focus:border-accent"
                          rows={5}
                          autoFocus
                          value={aboutDraft}
                          placeholder={t(
                            'settings_tell_us_more_about_yourself',
                          )}
                          onChange={(event) =>
                            setAboutDraft(event.target.value)
                          }
                        />
                        {aboutError && (
                          <p className="validation-error">
                            {t('members_slug_error_prefix')} {aboutError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            onClick={saveAbout}
                            isEnabled={!isSavingAbout}
                            size="small"
                            isFullWidth={false}
                          >
                            {t('generic_save_button')}
                          </Button>
                          <Button
                            onClick={() => {
                              setAboutDraft(about);
                              setAboutError(null);
                              setIsEditingAbout(false);
                            }}
                            variant="secondary"
                            size="small"
                            isFullWidth={false}
                          >
                            {t('generic_cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : about ? (
                      <p className="whitespace-pre-line">{about}</p>
                    ) : (
                      <button
                        onClick={() => {
                          setAboutDraft('');
                          setAboutError(null);
                          setIsEditingAbout(true);
                        }}
                        className="w-full text-left border-2 border-dashed border-accent/50 rounded-md p-4 text-accent hover:bg-accent-light transition-colors"
                      >
                        {t('members_slug_add_about')}
                      </button>
                    )}
                  </div>
                )}

                {/* Superpower & Dream — public: unlike the rest of the
                    preferences these two are conversation starters, so every
                    visitor sees them, not just staff. */}
                {(member?.preferences?.superpower ||
                  member?.preferences?.dream) && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6 flex flex-col gap-5">
                    {member.preferences?.superpower && (
                      <div>
                        <h4 className="font-medium text-xl mb-2">
                          {t('members_slug_superpower')}
                        </h4>
                        <p className="whitespace-pre-line">
                          {member.preferences.superpower}
                        </p>
                      </div>
                    )}
                    {member.preferences?.dream && (
                      <div>
                        <h4 className="font-medium text-xl mb-2">
                          {t('members_slug_dream')}
                        </h4>
                        <p className="whitespace-pre-line">
                          {member.preferences.dream}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <ProfileHomes
                  key={`homes-${member._id}`}
                  homes={homes}
                  viewer={currentUser}
                  isOwnProfile={isOwnProfile}
                  onSave={saveHomes}
                />
                <ProfileUpcomingVisits
                  key={`visits-${member._id}`}
                  visits={upcomingVisits}
                  viewer={currentUser}
                  isOwnProfile={isOwnProfile}
                  onSave={saveUpcomingVisits}
                />

                {/* Villages Section — federation only: where this member is
                    ambassador, manager, creator or referrer. Hidden when there
                    is nothing to show. */}
                {isFederationEnabled && villageConnections.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h4 className="font-medium text-xl mb-4">
                      {t('members_slug_villages')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {villageConnections.map(({ village, roles }) => (
                        <div key={village._id} className="flex flex-col gap-2">
                          <VillageCard village={village} />
                          <div className="flex flex-wrap gap-1.5">
                            {roles.map((role) => (
                              <span
                                key={role}
                                className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full"
                              >
                                {t(`village_connection_${role}`)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vouching Section — every citizen sees it, including on
                    their own profile, where it lists who vouched for them. */}
                {isVouchingEnabled && (isMember || isAdmin || isSpaceHost) && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <Vouching
                      vouchData={member?.vouched || []}
                      myId={currentUser?._id}
                      userId={member._id}
                      memberName={member.screenname}
                      minVouchingStayDuration={
                        Number(generalConfig?.minVouchingStayDuration) || 14
                      }
                    />
                  </div>
                )}

                {/* Staff View - User Data */}
                {staffInfoRoles.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="mb-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h4 className="font-medium text-xl">
                          {t('members_slug_user_information')}
                        </h4>
                        {staffInfoRoles.map((role) => (
                          <RoleTag key={role} role={getRoleTagKey(role)} />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('members_slug_user_information_role_note')}
                      </p>
                    </div>
                    <Card className="bg-accent-light">
                      {member?.email && (
                        <p className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="shrink-0 font-medium">
                            {t('user_data_email')}
                          </span>
                          <EmailDisplay
                            email={member.email}
                            className="min-w-0 flex-1 font-normal"
                          />
                        </p>
                      )}
                      {member?.walletAddress && (
                        <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="shrink-0 font-medium">
                            {t('user_data_walletAddress')}
                          </span>
                          <WalletDisplay
                            address={member.walletAddress}
                            className="min-w-0 flex-1"
                          />
                        </p>
                      )}
                      {member?.phone && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_phone')}
                          </span>{' '}
                          <span>{member.phone}</span>
                        </p>
                      )}
                      {member?.preferences?.sharedAccomodation && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_shared_accommodation')}
                          </span>{' '}
                          <span>{member.preferences.sharedAccomodation}</span>
                        </p>
                      )}
                      {member?.preferences?.diet && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_diet')}
                          </span>{' '}
                          <span>{member.preferences.diet}</span>
                        </p>
                      )}
                      {member?.preferences?.skills && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_skills')}
                          </span>{' '}
                          <span>
                            {member.preferences?.skills &&
                              member.preferences?.skills?.map((skill, i) => {
                                if (
                                  i ===
                                  (member.preferences?.skills?.length || 1) - 1
                                ) {
                                  return skill;
                                }
                                return skill + ', ';
                              })}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.needs && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_needs')}
                          </span>{' '}
                          <span>{member.preferences.needs}</span>
                        </p>
                      )}
                      {member?.preferences?.moreInfo && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_more_info')}
                          </span>{' '}
                          <span>{member.preferences.moreInfo}</span>
                        </p>
                      )}
                      {member?.subscription?.plan && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_subscription')}
                          </span>{' '}
                          <span>{member.subscription.plan}</span>
                        </p>
                      )}
                    </Card>
                  </div>
                )}

                {/* User Bookings Section */}
                {isBookingEnabled &&
                  member &&
                  currentUser &&
                  currentUser.roles.includes('space-host') && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                      <h4 className="font-medium text-xl mb-4">
                        {t('members_slug_bookings')}
                      </h4>
                      <UserBookings
                        user={member}
                        isSpaceHostView={true}
                        bookingConfig={bookingConfig ?? undefined}
                      />
                    </div>
                  )}

                {/* Events Section */}
                {isEventsEnabled && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h4 className="font-medium text-xl mb-4">
                      {t('members_slug_past_events')}
                    </h4>
                    <EventsList
                      limit={MAX_ATTENDED_EVENTS_TO_SHOW}
                      showPagination={false}
                      isStampView={true}
                      sort_by="-start"
                      where={pastEventsWhere}
                      emptyLabel={t('members_slug_no_past_events')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="validation-error">
              {t('members_slug_error_prefix')} {error}
            </p>
          )}
        </div>
      </div>

      {/* Add Link Modal */}
      {isAuthenticated && member?._id === currentUser?._id && showForm && (
        <>
          <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline">
            <div className="relative w-11/12 my-6 mx-auto max-w-3xl">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none p-10">
                <Heading
                  level={2}
                  className="self-center text-lg font-normal mb-3"
                >
                  {t('members_slug_links_title')}
                </Heading>
                {error && (
                  <p className="validation-error">
                    {t('members_slug_error')} {error}
                  </p>
                )}
                <form
                  className="flex flex-col space-y-7 w-full p-2"
                  onSubmit={(e) => {
                    e.preventDefault();

                    // Get all input values from the form
                    const formData = new FormData(e.currentTarget);
                    const newLinks = [];

                    // Process Twitter
                    const twitterUsername = formData.get('twitter-username');
                    if (twitterUsername) {
                      newLinks.push({
                        name: 'Twitter/X',
                        url: `https://twitter.com/${twitterUsername}`,
                      });
                    }

                    // Process Instagram
                    const instagramUsername =
                      formData.get('instagram-username');
                    if (instagramUsername) {
                      newLinks.push({
                        name: 'Instagram',
                        url: `https://instagram.com/${instagramUsername}`,
                      });
                    }

                    // Process LinkedIn
                    const linkedinUsername = formData.get('linkedin-username');
                    if (linkedinUsername) {
                      newLinks.push({
                        name: 'LinkedIn',
                        url: `https://linkedin.com/in/${linkedinUsername}`,
                      });
                    }

                    // Process Facebook
                    const facebookUsername = formData.get('facebook-username');
                    if (facebookUsername) {
                      newLinks.push({
                        name: 'Facebook',
                        url: `https://facebook.com/${facebookUsername}`,
                      });
                    }

                    // Process GitHub
                    const githubUsername = formData.get('github-username');
                    if (githubUsername) {
                      newLinks.push({
                        name: 'GitHub',
                        url: `https://github.com/${githubUsername}`,
                      });
                    }

                    // Process YouTube
                    const youtubeUsername = formData.get('youtube-username');
                    if (youtubeUsername) {
                      newLinks.push({
                        name: 'YouTube',
                        url: `https://youtube.com/c/${youtubeUsername}`,
                      });
                    }

                    // Process Website
                    const website = formData.get('website');
                    if (website) {
                      const websiteUrl = website.toString().startsWith('http')
                        ? website.toString()
                        : `https://${website}`;
                      newLinks.push({
                        name: 'Website',
                        url: websiteUrl,
                      });
                    }

                    // Filter out existing social links and keep only non-social links
                    const existingNonSocialLinks = links.filter((link) => {
                      const url = link.url.toLowerCase();
                      return (
                        !url.includes('twitter.com') &&
                        !url.includes('x.com') &&
                        !url.includes('instagram.com') &&
                        !url.includes('linkedin.com') &&
                        !url.includes('facebook.com') &&
                        !url.includes('github.com') &&
                        !url.includes('youtube.com') &&
                        !url.includes('tiktok.com')
                      );
                    });

                    // Combine new social links with existing non-social links
                    const allLinks = [...newLinks, ...existingNonSocialLinks];

                    // Save all links (replacing existing social links)
                    platform.user
                      .patch(currentUser?._id, {
                        links: allLinks,
                      })
                      .then(({ data }: { data: any }) => {
                        setLinks(data.links);
                        toggleShowForm(false);
                        setErrors(null);
                        setFormValues({
                          twitter: '',
                          instagram: '',
                          linkedin: '',
                          facebook: '',
                          github: '',
                          youtube: '',
                          website: '',
                        });
                      })
                      .catch((err: unknown) => {
                        const error = parseMessageFromError(err);
                        setErrors(error);
                      });
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Twitter Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          𝕏
                        </span>
                        <span className="font-medium">
                          {t('members_slug_twitter')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          twitter.com/
                        </span>
                        <input
                          type="text"
                          name="twitter-username"
                          placeholder={t('members_slug_username_placeholder')}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.twitter}
                        />
                      </div>
                    </div>

                    {/* Instagram Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          📸
                        </span>
                        <span className="font-medium">
                          {t('members_slug_instagram')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          instagram.com/
                        </span>
                        <input
                          type="text"
                          name="instagram-username"
                          placeholder={t('members_slug_username_placeholder')}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.instagram}
                        />
                      </div>
                    </div>

                    {/* LinkedIn Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          in
                        </span>
                        <span className="font-medium">
                          {t('members_slug_linkedin')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          linkedin.com/in/
                        </span>
                        <input
                          type="text"
                          name="linkedin-username"
                          placeholder={t('members_slug_username_placeholder')}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.linkedin}
                        />
                      </div>
                    </div>

                    {/* Facebook Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          ƒ
                        </span>
                        <span className="font-medium">
                          {t('members_slug_facebook')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          facebook.com/
                        </span>
                        <input
                          type="text"
                          name="facebook-username"
                          placeholder={t('members_slug_username_placeholder')}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.facebook}
                        />
                      </div>
                    </div>

                    {/* GitHub Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          🐙
                        </span>
                        <span className="font-medium">
                          {t('members_slug_github')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          github.com/
                        </span>
                        <input
                          type="text"
                          name="github-username"
                          placeholder={t('members_slug_username_placeholder')}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.github}
                        />
                      </div>
                    </div>

                    {/* YouTube Card */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center mb-3">
                        <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                          ▶️
                        </span>
                        <span className="font-medium">
                          {t('members_slug_youtube')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">
                          youtube.com/c/
                        </span>
                        <input
                          type="text"
                          name="youtube-username"
                          placeholder={t(
                            'members_slug_channelname_placeholder',
                          )}
                          className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none flex-grow"
                          defaultValue={formValues.youtube}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
                    <div className="flex items-center mb-3">
                      <span className="mr-2 text-lg w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full">
                        🌐
                      </span>
                      <span className="font-medium">
                        {t('members_slug_website')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        name="website"
                        placeholder={t('members_slug_website_placeholder')}
                        className="text-sm border-b border-gray-300 focus:border-blue-500 outline-none w-full"
                        defaultValue={formValues.website}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row items-center justify-center mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      className="btn-primary px-6 py-2 mr-6"
                    >
                      {t('members_slug_save')}
                    </button>
                    <button
                      type="button"
                      className="btn px-6 py-2"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleShowForm(false);
                        setFormValues({
                          twitter: '',
                          instagram: '',
                          linkedin: '',
                          facebook: '',
                          github: '',
                          youtube: '',
                          website: '',
                        });
                      }}
                    >
                      {t('members_slug_cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      )}

      {/* Report User Modal */}
      {openReportForm && (
        <Modal closeModal={() => setOpenReportForm(false)}>
          <div className="flex flex-col gap-5 min-w-[160px] h-full justify-center">
            <Heading level={2} className="text-lg">
              {t('report_user_title')}
            </Heading>
            {reportSuccess ? (
              <p className="text-green-500">{t('report_user_success')}</p>
            ) : (
              <>
                <div>
                  <label className="block mb-2">
                    {t('report_user_question', { name: member.screenname })}
                  </label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full h-22 p-2 bg-neutral rounded-md"
                    required
                  />
                </div>
                <div className="flex flex-row items-center gap-2 w-full">
                  <input
                    type="checkbox"
                    id="unsafe"
                    checked={isUnsafe}
                    onChange={(e) => setIsUnsafe(e.target.checked)}
                    className="w-fit"
                  />
                  <label htmlFor="unsafe">{t('report_user_unsafe')}</label>
                </div>
                <Button
                  variant="primary"
                  isEnabled={reportReason.length > 0}
                  onClick={reportUser}
                >
                  {t('report_user_submit')}
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

MemberPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    const res = await api.get(`/user/${query.slug}`, {
      headers: (req as NextApiRequest)?.cookies?.access_token
        ? {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          }
        : {},
    });
    const member = res.data.results;
    // `referredBy` is a user id; resolve it to a name we can link to. A
    // deleted or unreadable referrer just drops the line, it never fails
    // the page.
    let referrer = null;
    if (member?.referredBy) {
      try {
        const referrerRes = await api.get(`/user/${member.referredBy}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token
            ? {
                Authorization: `Bearer ${
                  (req as NextApiRequest)?.cookies?.access_token
                }`,
              }
            : {},
        });
        const { _id, slug, screenname } = referrerRes.data.results || {};
        if (slug && screenname) {
          referrer = { _id, slug, screenname };
        }
      } catch (err: unknown) {
        console.log('Could not load referrer', err);
      }
    }

    return {
      member,
      referrer,
      bookingConfig: config.booking,
    };
  } catch (err: unknown) {
    console.log('Error', err);

    return {
      loadError: parseMessageFromError(err),
      referrer: null,
      bookingConfig: null,
    };
  }
};

export default MemberPage;
