import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import PostList from '../../components/PostList';
import UpcomingEvents from '../../components/UpcomingEvents';
import UserList from '../../components/UserList';
import Heading from '../../components/ui/Heading';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';

const ChannelPage = ({ channel }) => {
  const { user, isAuthenticated } = useAuth();

  if (!channel) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{channel.name}</title>
        <meta name="description" content={channel.description} />
      </Head>
      <main className="main-content w-full">
        <div className="columns">
          <div className="col lg two-third">
            <div className="channel">
              <div className="page-header">
                <Heading>{channel.name}</Heading>
                <div className="page-actions">
                  {user &&
                    (user.roles.includes('admin') ||
                      channel.createdBy === user._id) && (
                      <Link
                        as={`/edit-channel/${channel.slug}`}
                        href="/edit-channel/[slug]"
                      >
                        edit
                      </Link>
                    )}
                </div>
              </div>
              {channel.description && (
                <div className="channel-sub-header">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: channel.description,
                    }}
                  />
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
    </>
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
