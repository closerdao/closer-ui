import Head from 'next/head';

import React, { useEffect } from 'react';

import ApplicationList from '../../components/ApplicationList';
import Layout from '../../components/Layout';
import Tabs from '../../components/Tabs';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { __ } from '../../utils/helpers';

const openApplications = { where: { status: 'open' } };
const approvedApplications = { where: { status: 'approved' } };
const inConversationApplications = { where: { status: 'conversation' } };
const rejectedApplications = { where: { status: 'rejected' } };

const Applications = () => {
  const { user } = useAuth();
  const { platform } = usePlatform();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        platform.application.getCount(openApplications),
        platform.application.getCount(approvedApplications),
        platform.application.getCount(inConversationApplications),
        platform.application.getCount(rejectedApplications),
      ]);
    };

    if (user && user.roles.includes('community-curator')) {
      loadData();
    }
  }, [user, platform]);

  if (
    !user ||
    (!user.roles.includes('community-curator') && !user.roles.includes('admin'))
  ) {
    return <PageNotAllowed />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{__('applications_title')}</title>
      </Head>
      <main className="main-content">
        <div className="page-header mb-4">
          <div>
            <h1>{__('applications_title')}</h1>
          </div>
        </div>
        <div className="md:flex md:flex-row-reverse">
          <div className="md:w-1/3 md:ml-4">
            <div className="card">
              <h3 className="card-title">{__('applications_subtitle')}</h3>
              <div className="card-body">
                <p>
                  {__('applications_open')}{' '}
                  <b>{platform.application.findCount(openApplications)}</b>
                </p>
                <p>
                  {__('applications_in_conversation')}{' '}
                  <b>
                    {platform.application.findCount(inConversationApplications)}
                  </b>
                </p>
                <p>
                  {__('applications_accepted')}{' '}
                  <b>{platform.application.findCount(approvedApplications)}</b>
                </p>
                <p>
                  {__('applications_rejected')}{' '}
                  <b>{platform.application.findCount(rejectedApplications)}</b>
                </p>
              </div>
            </div>
          </div>
          <div className="md:w-2/3">
            <Tabs
              tabs={[
                {
                  title: 'Open',
                  value: 'open',
                  content: <ApplicationList status="open" />,
                },
                {
                  title: 'Chatting',
                  value: 'conversation',
                  content: (
                    <ApplicationList
                      status="conversation"
                      managedBy={user._id}
                    />
                  ),
                },
                {
                  title: 'Rejected',
                  value: 'rejected',
                  content: (
                    <ApplicationList status="rejected" hideRejectButton />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default Applications;
