import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useState } from 'react';
import Linkify from 'react-linkify';

import Layout from '../../components/Layout';
import PostList from '../../components/PostList';
import UpcomingEvents from '../../components/UpcomingEvents';
import UserList from '../../components/UserList';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth.js';
import api from '../../utils/api';

const ChannelPage = ({ channel }) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [error, setErrors] = useState(false);

  if (!channel) {
    return <PageNotFound />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{channel.name}</title>
        <meta name="description" content={channel.description} />
      </Head>
      {error && <div className="validation-error">{error}</div>}
      <main className="main-content fullwidth intro">
        <div className="columns">
          <div className="col lg two-third">
            <div className="channel">
              <div className="page-header">
                <h1>{channel.name}</h1>
                <div className="page-actions">
                  {user &&
                    (user.roles.includes('admin') ||
                      channel.createdBy === user._id) && (
                    <Link
                      as={`/edit-channel/${channel.slug}`}
                      href="/edit-channel/[slug]"
                    >
                      <a>edit</a>
                    </Link>
                  )}
                </div>
              </div>
              {channel.description && (
                <div className="channel-sub-header">
                  <p className="about-text">
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
                      {channel.description}
                    </Linkify>
                  </p>
                </div>
              )}
              <PostList
                allowCreate
                parentType="channel"
                channel={channel._id}
              />
            </div>
          </div>
          <div className="col third">
            <UserList
              channel={channel._id}
              title="Channel members"
              canInviteUsers={isAuthenticated && user._id === channel.createdBy}
            />
            <UpcomingEvents user={user} channel={channel._id} />
          </div>
        </div>
      </main>
    </Layout>
  );
};

ChannelPage.getInitialProps = async ({ query }) => {
  try {
    if (!query.channel) {
      throw new Error('No channel');
    }
    const {
      data: { results: channel },
    } = await api.get(`/channel/${query.channel}`);

    return { channel };
  } catch (err) {
    return {
      error: err.message,
    };
  }
};

export default ChannelPage;
