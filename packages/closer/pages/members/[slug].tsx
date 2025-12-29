import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { FormEvent, useEffect, useState } from 'react';

import CitizenSubscriptionProgress from '../../components/CitizenSubscriptionProgress';
import ConnectedWallet from '../../components/ConnectedWallet';
import EventsList from '../../components/EventsList';
import FinancedTokenProgress from '../../components/FinancedTokenProgress';
import Modal from '../../components/Modal';
import UploadPhoto from '../../components/UploadPhoto';
import UserBookings from '../../components/UserBookings';
import Vouching from '../../components/Vouching';
import { Card } from '../../components/ui';
import Button from '../../components/ui/Button';
import Heading from '../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { TiDelete } from '@react-icons/all-files/ti/TiDelete';
import { Twitter, Instagram, Facebook, Linkedin, Github, Youtube, Music, Link as LinkIcon, Settings } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { User, UserLink } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { FinanceApplication } from '../../types';
import { GeneralConfig } from '../../types/api';
import api, { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface MemberPageProps {
  member: User;
  loadError: string;
  generalConfig: GeneralConfig;
  financeTokenApplications: FinanceApplication[];
}

const MemberPage = ({
  member,
  loadError,
  generalConfig,
  financeTokenApplications,
}: MemberPageProps) => {
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

  const router = useRouter();
  const [introMessage, setMessage] = useState('');
  const [openIntro, setOpenIntro] = useState(false);
  const [error, setErrors] = useState(null);
  const [sendError, setSendErrors] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
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
  const [activeApplications, setActiveApplications] = useState<
    FinanceApplication[]
  >([]);

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
  useEffect(() => {
    if (currentUser && !isLoading) {
      (async () => {
        const financeApplicationRes = await api.get('/financeApplication', {
          params: {
            where: {
              userId: currentUser?._id,
            },
          },
        });
        const financeApplications = financeApplicationRes?.data?.results;

        console.log('financeApplications===', financeApplications);

        const activeApplications = financeApplications.filter(
          (application: FinanceApplication) =>
            ['pending-payment', 'paid'].includes(application.status),
        );

        console.log('=== activeApplications ===', activeApplications);

        if (financeApplications) {
          setActiveApplications(activeApplications);
        }
      })();
    }
  }, [currentUser, isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const { data } = await platform.user.patch(currentUser?._id, {
        links: [...links, { name: linkName, url: linkUrl }],
      });
      setLinks(data.links);
      setLinkName('');
      setLinkUrl('');
      toggleShowForm(!showForm);
      setErrors(null);
    } catch (err: unknown) {
      const error = parseMessageFromError(err);
      setErrors(error);
    }
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
      const { data } = await api.get(`/report/user/${member._id}`);
      setHasReported(!!data.results);
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
                      <div className="w-36 md:w-48 h-36 md:h-48 rounded-full bg-gray-100 flex items-center justify-center">
                        <FaUser className="text-gray-300 text-6xl" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex flex-col flex-grow md:ml-4">
                  <h3 className="font-medium text-4xl md:text-5xl text-center md:text-left">
                    {member.screenname}
                  </h3>

                  {/* Roles Tags */}
                  <div className="mt-3 mb-4">
                    {member.roles && (
                      <div className="text-sm tags flex flex-wrap justify-center md:justify-start gap-2">
                        {member.roles.map((role) => (
                          <Link
                            as={`/members?role=${encodeURIComponent(role)}`}
                            href="/members"
                            key={role}
                            className="tag bg-gray-400 hover:bg-gray-200 px-2 py-1 rounded-full"
                          >
                            {role}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

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
                {isAuthenticated && member?._id === currentUser?._id && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h4 className="font-medium text-xl mb-4">
                      {t('members_slug_wallet')}
                    </h4>
                    <ConnectedWallet />
                  </div>
                )}

                {/* Edit Profile Link - Only show when viewing own profile */}
                {isAuthenticated && member?._id === currentUser?._id && (
                  <div className="mb-6">
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors w-full justify-center"
                    >
                      <Settings className="w-4 h-4" />
                      {t('buttons_edit_profile')}
                    </Link>
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
                          const extractUsername = (url: string, pattern: RegExp) => {
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
                            if (url.includes('twitter.com/') || url.includes('x.com/')) {
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
                            } else if (url.includes('youtube.com/c/') || url.includes('youtube.com/@')) {
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
                        let IconComponent: React.ComponentType<{ className?: string }> = LinkIcon;
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
                            className="group flex flex-row items-center justify-between py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center">
                              <span className="mr-2 w-6 h-6 flex items-center justify-center bg-gray-100 rounded-full">
                                <IconComponent className="w-4 h-4 text-gray-700" />
                              </span>
                              <a
                                href={link.url}
                                className="hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {networkName}
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
                                  <TiDelete className="text-gray-500 text-xl hover:text-red-500" />
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
                {/* Vouching Section */}
                {(isMember || isAdmin || isSpaceHost) && !isOwnProfile && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h4 className="font-medium text-xl mb-4">
                      {t('members_slug_vouching')}
                    </h4>
                    <Vouching
                      vouchData={member?.vouched || []}
                      myId={currentUser?._id}
                      userId={member._id}
                      minVouchingStayDuration={
                        Number(generalConfig?.minVouchingStayDuration) || 14
                      }
                    />
                  </div>
                )}

                {/* Space Host View - User Data */}
                {currentUser && currentUser.roles.includes('space-host') && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h4 className="font-medium text-xl mb-4">
                      {t('members_slug_user_information')}
                    </h4>
                    <Card className="bg-accent-light">
                      {member?.email && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_email')}
                          </span>{' '}
                          <span>{member.email}</span>
                        </p>
                      )}
                      {member?.walletAddress && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_walletAddress')}
                          </span>{' '}
                          <span>{member.walletAddress}</span>
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
                      {member?.preferences?.superpower && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_superpower')}
                          </span>{' '}
                          <span>{member.preferences.superpower}</span>
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
                      {member?.preferences?.dream && (
                        <p className="mb-2">
                          <span className="font-medium">
                            {t('user_data_dream')}
                          </span>{' '}
                          <span>{member.preferences.dream}</span>
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

                {/* Citizenship Section */}
                {member?.citizenship &&
                  (member._id === currentUser?._id ||
                    currentUser?.roles?.includes('admin') ||
                    currentUser?.roles?.includes('community-curator')) && (
                    <div className="bg-white mb-6 space-y-6">
                    
                      <CitizenSubscriptionProgress member={member} />

                      <div className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(financeTokenApplications, null, 2)}
                      </div>
                      {activeApplications?.length > 0 && (
                        <FinancedTokenProgress
                          member={member}
                          activeApplications={activeApplications}
                        />
                      )}
                    </div>
                  )}

                {/* User Bookings Section */}
                {member &&
                  currentUser &&
                  currentUser.roles.includes('space-host') && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                      <h4 className="font-medium text-xl mb-4">
                        {t('members_slug_bookings')}
                      </h4>
                      <UserBookings user={member} isSpaceHostView={true} />
                    </div>
                  )}

                {/* Events Section */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="font-medium text-xl mb-4">
                    {t('members_slug_my_events')}
                  </h4>
                  <EventsList
                    limit={7}
                    showPagination={false}
                    where={{
                      attendees: member?._id,
                      visibility: 'public',
                    }}
                  />
                </div>
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
    const [res, generalRes, messages] = await Promise.all([
      api.get(`/user/${query.slug}`, {
        headers: (req as NextApiRequest)?.cookies?.access_token
          ? {
              Authorization: `Bearer ${
                (req as NextApiRequest)?.cookies?.access_token
              }`,
            }
          : {},
      }),

      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;

    return {
      member: res.data.results,
      generalConfig,

      messages,
    };
  } catch (err: unknown) {
    console.log('Error', err);

    return {
      loadError: parseMessageFromError(err),
      generalConfig: null,

      messages: null,
    };
  }
};

export default MemberPage;
