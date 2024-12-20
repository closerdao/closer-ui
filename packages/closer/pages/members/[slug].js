import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ConnectedWallet from '../../components/ConnectedWallet';
import EventsList from '../../components/EventsList';
import UploadPhoto from '../../components/UploadPhoto/UploadPhoto';
import UserBookings from '../../components/UserBookings';
import { Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { TiDelete } from '@react-icons/all-files/ti/TiDelete';
import { useTranslations } from 'next-intl';

import dayjs from 'dayjs';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import api, { cdn } from '../../utils/api';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const MemberPage = ({ member, loadError }) => {
  const t = useTranslations();
  const { user: currentUser, isAuthenticated, refetchUser } = useAuth();



  const router = useRouter();
  const [introMessage, setMessage] = useState('');
  const [openIntro, setOpenIntro] = useState(false);
  const [error, setErrors] = useState(false);
  const [sendError, setSendErrors] = useState(false);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState(member?.links || []);
  const [about, setAbout] = useState(member?.about || '');
  const [tagline, setTagline] = useState(member?.tagline || '');
  const [showForm, toggleShowForm] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const { platform } = usePlatform();

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await platform.user.patch(currentUser?._id, {
        links: (links || []).concat({ name: linkName, url: linkUrl }),
      });
      setLinks(data.links);
      setLinkName('');
      setLinkUrl('');
      toggleShowForm(!showForm);
      setErrors(null);
    } catch (err) {
      const error = err?.response?.data?.error || err.message;
      setErrors(error);
    }
  };

  const deleteLink = async (link) => {
    try {
      const { data } = await platform.user.patch(currentUser?._id, {
        links: links.filter((item) => item.name !== link.name),
      });
      setLinks(data.links);
      setErrors(null);
    } catch (err) {
      const error = err?.response?.data?.error || err.message;
      setErrors(error);
    }
  };

  const handleClick = (event) => {
    event.preventDefault();
    saveAbout(about);
    saveTagline(tagline);
    setHasSaved(true);
  };

  const saveAbout = async (about) => {
    try {
      const {
        data: { results: savedData },
      } = await api.patch(`/user/${member._id}`, { about });
      setAbout(savedData.about);
      setErrors(null);
    } catch (err) {
      const error = err?.response?.data?.error || err.message;
      setErrors(error);
    }
  };

  const saveTagline = async (tagline) => {
    try {
      const {
        data: { results: savedData },
      } = await api.patch(`/user/${member._id}`, { tagline });
      setTagline(savedData.tagline);
      setErrors(null);
    } catch (err) {
      const error = err?.response?.data?.error || err.message;
      setErrors(error);
    }
  };

  const sendMessage = async (content) => {
    try {
      setSendErrors(null);
      await api.post('/message', { content, visibleBy: [member._id] });
      setOpenIntro(false);
    } catch (err) {
      const error = err?.response?.data?.error || err.message;
      setSendErrors(error);
    }
  };

  if (loadError) {
    return <PageNotFound error={loadError} />;
  }

  if (!member) {
    return <PageNotFound error={error} />;
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
                      placeholder="Type your message"
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

        <div className="flex flex-col items-start max-w-5xl">
          <div className="flex flex-col items-start space-y-5 md:w-full md:mt-3 w-full">
            <div className="flex flex-col w-full">
              <section className="w-full flex gap-8">
                <div className="flex flex-col md:flex-row">
                  <div className="group  items-center justify-start relative">
                    {isAuthenticated && member._id === currentUser._id ? (
                      <UploadPhoto
                        model="user"
                        id={member._id}
                        onSave={() => {
                          router.push(router.asPath);
                        }}
                        label={member.photo ? 'Change photo' : 'Add photo'}
                      />
                    ) : member?.photo ? (
                      <img
                        src={`${cdn}${member.photo}-profile-lg.jpg`}
                        loading="lazy"
                        alt={member.screenname}
                        className="peer w-32 md:w-44 mt-4 md:mt-0 rounded-full"
                      />
                    ) : (
                      <FaUser className="text-gray-200 text-6xl" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="font-medium text-5xl md:text-6xl md:w-6/12 flex flex-wrap">
                    {member.screenname}
                  </h3>
                  {isAuthenticated && member._id !== currentUser._id && (
                    <div className="my-3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenIntro(!openIntro);
                        }}
                        className="btn-primary"
                      >
                        {t('members_slug_get_introduced')}
                      </a>
                    </div>
                  )}
                  <div>
                    {member.roles && (
                      <div className="text-sm mt-1 tags">
                        {member.roles.map((role) => (
                          <Link
                            as={`/members?role=${encodeURIComponent(role)}`}
                            href="/members"
                            key={role}
                            className="tag"
                          >
                            {role}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <div className="flex flex-col items-start w-full gap-8">
                <div className="w-full space-y-6">
                  {currentUser && currentUser.roles.includes('space-host') && (
                    <Card className="my-6 bg-accent-light w-full">
                      {member?.email && (
                        <p>
                          {t('user_data_email')}{' '}
                          <span className="font-bold">{member.email}</span>
                        </p>
                      )}
                      {member?.phone && (
                        <p>
                          {t('user_data_phone')}{' '}
                          <span className="font-bold">{member.phone}</span>
                        </p>
                      )}
                      {member?.preferences?.sharedAccomodation && (
                        <p>
                          {t('user_data_shared_accommodation')}{' '}
                          <span className="font-bold">
                            {member.preferences.sharedAccomodation}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.diet && (
                        <p>
                          {t('user_data_diet')}{' '}
                          <span className="font-bold">
                            {member.preferences.diet}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.skills && (
                        <p>
                          {t('user_data_skills')}{' '}
                          <span className="font-bold">
                            {member.preferences.skills.map((skill, i) => {
                              if (i === member.preferences.skills.length - 1) {
                                return skill;
                              }
                              return skill + ', ';
                            })}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.superpower && (
                        <p>
                          {t('user_data_superpower')}{' '}
                          <span className="font-bold">
                            {member.preferences.superpower}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.needs && (
                        <p>
                          {t('user_data_needs')}{' '}
                          <span className="font-bold">
                            {member.preferences.needs}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.dream && (
                        <p>
                          {t('user_data_dream')}{' '}
                          <span className="font-bold">
                            {member.preferences.dream}
                          </span>
                        </p>
                      )}
                      {member?.preferences?.moreInfo && (
                        <p>
                          {t('user_data_more_info')}{' '}
                          <span className="font-bold">
                            {member.preferences.moreInfo}
                          </span>
                        </p>
                      )}
                      {member?.subscription?.plan && (
                        <p>
                          {t('user_data_subscription')}{' '}
                          <span className="font-bold">
                            {member.subscription.plan}
                          </span>
                        </p>
                      )}
                    </Card>
                  )}

                  {/* {
    "createdAt": "2024-12-20T13:03:34.513Z",
    "status": "open",
    "iban": "rewqwerq",
    "why": "sdfff",
    "tokensToFinance": 90,
    "totalToPayInFiat": 24160.26,
    "charges": []
} */}

                  {member?.subscription?.citizenship && (
                    <Card className=" w-full">
                      <p>
                        {t('subscriptions_citizen_user_page_created')}{' '}
                        <span className="font-bold">
                          {dayjs(member.subscription.citizenship.createdAt).format('YYYY-MM-DD')}
                        </span>
                      </p>
                      <p>
                        {t('subscriptions_citizen_user_page_why')}{' '}
                        <span className="font-bold">
                          {member.subscription.citizenship.why}
                        </span>
                      </p>
                      <p>
                        {t('subscriptions_citizen_user_page_total_to_pay')}{' '}
                        <span className="font-bold">
                        €{member.subscription.citizenship.totalToPayInFiat}
                        </span>
                      </p>
                      <p>
                        {t('subscriptions_citizen_user_page_tokens_to_finance')}{' '}
                        <span className="font-bold">
                          {member.subscription.citizenship.tokensToFinance}
                        </span>
                      </p>
                      {member.subscription.citizenship.charges.length > 0 &&
                      
                      <p>
                       {/* TODO: add payment history */}
                      </p>
                      }
                    </Card>
                  )}
                </div>

                <div>
                  {member &&
                    currentUser &&
                    currentUser.roles.includes('space-host') && (
                      <UserBookings user={member} isSpaceHostView={true} />
                    )}
                </div>

                {isAuthenticated && member._id === currentUser._id && (
                  <ConnectedWallet />
                )}
                <div className="">
                  <div className="page-title flex justify-between">
                    <h3 className="mt-8 md:mt-3">
                      {t('members_slug_my_events')}
                    </h3>
                  </div>

                  <EventsList
                    limit={7}
                    showPagination={false}
                    where={{
                      attendees: member._id,
                      visibility: 'public',
                    }}
                  />

                  <div className="mt-8">
                    <div>
                      <p className="font-semibold text-md mr-5">
                        {t('members_slug_stay_social')}
                      </p>
                      {isAuthenticated && member._id === currentUser._id && (
                        <div className="flex flex-row items-center justify-start space-x-3 w-20">
                          <a
                            href="#"
                            name="Add links"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleShowForm(!showForm);
                            }}
                          >
                            <button className="btn-small">Add</button>
                          </a>
                        </div>
                      )}
                    </div>
                    <ul className="flex flex-col w-full space-y-1 mt-4">
                      {links
                        ? links.map((link) => (
                            <li
                              key={link._id}
                              className="group flex flex-row items-center justify-start space-x-5 mb-1"
                            >
                              <a href={link.url}>{link.name}</a>
                              {isAuthenticated &&
                                member._id === currentUser._id && (
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      deleteLink(link);
                                    }}
                                  >
                                    <TiDelete className="text-gray-500 text-lg hover:text-black hidden group-hover:block" />
                                  </a>
                                )}
                            </li>
                          ))
                        : 'No links yet'}
                    </ul>

                    {isAuthenticated &&
                      member._id === currentUser._id &&
                      showForm && (
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
                                  onSubmit={handleSubmit}
                                >
                                  <div>
                                    <label>
                                      {t('members_slug_links_name')}
                                    </label>
                                    <input
                                      id="name"
                                      type="text"
                                      placeholder="Name..."
                                      value={linkName}
                                      onChange={(e) =>
                                        setLinkName(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label>{t('members_slug_links_url')}</label>
                                    <input
                                      id="url"
                                      type="text"
                                      placeholder="Url..."
                                      value={linkUrl}
                                      onChange={(e) =>
                                        setLinkUrl(e.target.value)
                                      }
                                      required
                                    />
                                  </div>
                                  <div className="flex flex-row items-center justify-start">
                                    <button
                                      type="submit"
                                      className="btn-primary w-24 mr-6"
                                    >
                                      {t('members_slug_links_submit')}
                                    </button>
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        toggleShowForm(!showForm);
                                      }}
                                    >
                                      {t('generic_cancel')}
                                    </a>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
                        </>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="validation-error">Error: {error}</p>}
        </div>
      </div>
    </>
  );
};

MemberPage.getInitialProps = async (context) => {
  const { req, query } = context;
  try {
    const [res, messages] = await Promise.all([
      api.get(`/user/${query.slug}`, {
        headers: req?.cookies?.access_token
          ? { Authorization: `Bearer ${req?.cookies?.access_token}` }
          : {},
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    return {
      member: res.data.results,
      messages,
    };
  } catch (err) {
    console.log('Error', err.message);

    return {
      loadError: err.message,
      messages: null,
    };
  }
};

export default MemberPage;
