import Head from 'next/head';
import { useRouter } from 'next/router';

import { FC, useState } from 'react';

import UploadPhoto from '../../components/UploadPhoto';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { type User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { parseMessageFromError } from '../../utils/common';

type UpdateUserFunction = (value: string) => Promise<void>;

const MemberPage: FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // const [introMessage, setMessage] = useState('');
  // const [openIntro, setOpenIntro] = useState(false);
  // const [sendError, setSendErrors] = useState(false);
  // const [linkName, setLinkName] = useState('');
  // const [linkUrl, setLinkUrl] = useState('');
  // const [links, setLinks] = useState(member?.links || []);
  // const [about, setAbout] = useState(member?.about || '');
  // const [tagline, setTagline] = useState(member?.tagline || '');
  // const [showForm, toggleShowForm] = useState(false);
  // const [editProfile, toggleEditProfile] = useState(false);

  const { platform } = usePlatform() as any;

  const saveUserAttribute =
    (attribute: keyof User): UpdateUserFunction =>
    async (value: string) => {
      try {
        await platform.user.patch(user?._id, { [attribute]: value });
        setError(null);
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
      }
    };

  // const handleSubmit = async (event: ) => {
  //   event.preventDefault();
  //   try {
  //     const { data } = await platform.user.patch(user?._id, {
  //       links: (links || []).concat({ name: linkName, url: linkUrl }),
  //     });
  //     // setLinks(data.links);
  //     setLinkName('');
  //     setLinkUrl('');
  //     toggleShowForm(!showForm);
  //     setErrors(null);
  //   } catch (err) {
  //     const error = err?.response?.data?.error || err.message;
  //     setErrors(error);
  //   }
  // };

  // const deleteLink = async (link) => {
  //   try {
  //     const { data } = await platform.user.patch(user?._id, {
  //       links: links.filter((item) => item.name !== link.name),
  //     });
  //     setLinks(data.links);
  //     setErrors(null);
  //   } catch (err) {
  //     const error = err?.response?.data?.error || err.message;
  //     setErrors(error);
  //   }
  // };

  // const handleClick = (event) => {
  //   event.preventDefault();
  //   saveAbout(about);
  //   saveTagline(tagline);
  //   toggleEditProfile(!editProfile);
  // };

  // const saveAbout = async (about) => {
  //   try {
  //     const {
  //       data: { results: savedData },
  //     } = await api.patch(`/user/${member._id}`, { about });
  //     setAbout(savedData.about);
  //     setErrors(null);
  //   } catch (err) {
  //     const error = err?.response?.data?.error || err.message;
  //     setErrors(error);
  //   }
  // };

  // const saveTagline = async (tagline) => {
  //   try {
  //     const {
  //       data: { results: savedData },
  //     } = await api.patch(`/user/${member._id}`, { tagline });
  //     setTagline(savedData.tagline);
  //     setErrors(null);
  //   } catch (err) {
  //     const error = err?.response?.data?.error || err.message;
  //     setErrors(error);
  //   }
  // };

  // const sendMessage = async (content) => {
  //   try {
  //     setSendErrors(null);
  //     await api.post('/message', { content, visibleBy: [member._id] });
  //     setOpenIntro(false);
  //   } catch (err) {
  //     const error = err?.response?.data?.error || err.message;
  //     setSendErrors(error);
  //   }
  // };

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Page does not exist" />;
  }

  return (
    <>
      <Head>
        <title>{user.screenname}</title>
      </Head>
      <div className="main-content w-full flex flex-col min-h-screen py-2">
        <Heading>🤓 Your Info</Heading>
        <Heading level={2} className="mt-16">
          ⭐ Account
        </Heading>
        <Input
          label="Name"
          value={user.screenname}
          onChange={saveUserAttribute('screenname')}
          className="mt-4"
        />
        <Input
          label="Email"
          value={user.email}
          onChange={saveUserAttribute('email')}
          className="mt-8"
          validation="email"
        />
        <div className="md:w-72 items-center justify-start relative mt-8">
          <label className="font-medium text-complimentary-light">
            Profile Picture
          </label>
          <UploadPhoto
            model="user"
            id={user._id}
            label={user.photo ? 'Change' : 'Add photo'}
            className="my-4"
          />
        </div>
      </div>
    </>
  );
  {
    /* <div className="main-content w-full"> */
  }
  {
    /* {openIntro && (
          <>
            <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline">
              <div className="relative w-11/12 my-6 mx-auto max-w-3xl">
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col space-x-5 w-full bg-background outline-none focus:outline-none p-10">
                  {sendError && (
                    <p className="validation-error">
                      {__('members_slug_error')} {sendError}
                    </p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage(introMessage);
                    }}
                  >
                    <label>
                      {__('members_slug_contact')} {member.screenname}
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
                      {__('members_slug_send')}
                    </button>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenIntro(false);
                      }}
                    >
                      {__('members_slug_cancel')}
                    </a>
                  </form>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        )} */
  }
  {
    /* 
        <div className="flex flex-col items-start">
          <div className="flex flex-col items-start space-y-5 md:w-full md:mt-3">
            <div className="flex flex-col md:flex-row w-full">
              <div className="group md:w-72 items-center justify-start relative">
                <div className="flex flex-col items-start mb-4 md:mr-8 md:items-center">
                  {user.photo ? (
                    <img
                      src={`${cdn}${user.photo}-profile-lg.jpg`}
                      loading="lazy"
                      alt={user.screenname}
                      className="peer w-32 md:w-44 mt-4 md:mt-0 rounded-full"
                    />
                  ) : (
                    <FaUser className="text-gray-200 text-6xl" />
                  )}
                  <div className="items-center h-full lg:opacity-0 group-hover:opacity-80 mt-2">
                    {isAuthenticated && (
                      <UploadPhoto
                        model="user"
                        id={user._id}
                        onSave={() => {
                          router.push(router.asPath);
                        }}
                        label={user.photo ? 'Change photo' : 'Add photo'}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start w-full gap-8">
                <div>
                  <h3 className="font-medium text-5xl md:text-6xl md:w-6/12 flex flex-wrap">
                    {user.screenname}
                  </h3>
                  {/* 
                  {isAuthenticated && (
                    <div className="my-3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenIntro(!openIntro);
                        }}
                        className="btn-primary"
                      >
                        {__('members_slug_get_introduced')}
                      </a>
                    </div>
                  )} */
  }
  {
    /* <h6 className="text-sm my-2 ml-1">{user.email}</h6>
                  <div className="mt-1 w-full">
                    {user.roles && (
                      <div className="text-sm mt-1 tags">
                        {user.roles.map((role) => (
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
                    {editProfile ? (
                      <Input
                        autoFocus
                        value={about}
                        className="w-full md:w-11/12"
                        onChange={(e) => setAbout(e.target.value)}
                        onBlur={() => {
                          saveAbout(about);
                        }}
                      />
                    ) : isAuthenticated && member._id === user._id ? (
                      <p className="mt-6 pb-2 w-full md:w-11/12">
                        <Linkify
                          componentDecorator={(
                            decoratedHref,
                            decoratedText,
                            key,
                          ) => (
                            <a
                              target="_blank"
                              rel="nofollow noreferrer"
                              href={decoratedHref}
                              key={key}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {decoratedText}
                            </a>
                          )}
                        >
                          {about}
                          {!about && (
                            <span className="placeholder">
                              {__('members_slug_about_prompt')}
                            </span>
                          )}
                        </Linkify>
                      </p>
                    ) : (
                      <p className="">
                        <Linkify
                          componentDecorator={(
                            decoratedHref,
                            decoratedText,
                            key,
                          ) => (
                            <a
                              target="_blank"
                              rel="nofollow noreferrer"
                              href={decoratedHref}
                              key={key}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {decoratedText}
                            </a>
                          )}
                        >
                          {about}
                          {!about && (
                            <span className="placeholder">
                              {member.screenname}{' '}
                              {__('members_slug_about_empty')}
                            </span>
                          )}
                        </Linkify>
                      </p>
                    )}
                  </div>
                  {isAuthenticated && member._id === user._id && (
                    <button
                      type="button"
                      className="btn-primary mt-2"
                      onClick={handleClick}
                    >
                      {editProfile ? 'Save' : 'Edit'}
                    </button>
                  )}
                </div>
                {isAuthenticated && member._id === user._id && (
                  <ConnectedWallet />
                )} */
  }
  {
    /* <div className="">
                  <div className="page-title flex justify-between">
                    <h3 className="mt-8 md:mt-3">
                      {__('members_slug_my_events')}
                    </h3>
                  </div> */
  }

  {
    /* <EventsList
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
                        {__('members_slug_stay_social')}
                      </p>
                      {isAuthenticated && member._id === user._id && (
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
                              {isAuthenticated && member._id === user._id && (
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

                    {isAuthenticated && member._id === user._id && showForm && (
                      <>
                        <div className="flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline">
                          <div className="relative w-11/12 my-6 mx-auto max-w-3xl">
                            <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-background outline-none focus:outline-none p-10">
                              <h2 className="self-center text-lg font-normal mb-3">
                                {__('members_slug_links_title')}
                              </h2>
                              {error && (
                                <p className="validation-error">
                                  {__('members_slug_error')} {error}
                                </p>
                              )}
                              <form
                                className="flex flex-col space-y-7 w-full p-2"
                                onSubmit={handleSubmit}
                              >
                                <Input
                                  label={__('members_slug_links_name')}
                                  type="text"
                                  placeholder="Name..."
                                  value={linkName}
                                  onChange={(e) => setLinkName(e.target.value)}
                                  isRequired
                                />
                                <Input
                                  label={__('members_slug_links_url')}
                                  type="text"
                                  placeholder="Url..."
                                  value={linkUrl}
                                  onChange={(e) => setLinkUrl(e.target.value)}
                                  isRequired
                                />

                                <div className="flex flex-row items-center justify-start">
                                  <button
                                    type="submit"
                                    className="btn-primary w-24 mr-6"
                                  >
                                    {__('members_slug_links_submit')}
                                  </button>
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleShowForm(!showForm);
                                    }}
                                  >
                                    {__('generic_cancel')}
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
          </div> */
  }

  {
    /* {error && <p className="validation-error">Error: {error}</p>} */
  }
  //       </div>
  //     </div>
  //   </>
  // );
};

export default MemberPage;
