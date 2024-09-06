import Head from 'next/head';

import { useEffect } from 'react';

import ApplicationList from '../../components/ApplicationList';
import Tabs from '../../components/Tabs';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { loadLocaleData } from '../../utils/locale.helpers';

const openApplications = { where: { status: 'open' } };
const approvedApplications = { where: { status: 'approved' } };
const inConversationApplications = { where: { status: 'conversation' } };
const rejectedApplications = { where: { status: 'rejected' } };

const Applications = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform }: any = usePlatform();

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
    <>
      <Head>
        <title>{t('applications_title')}</title>
      </Head>
      <main className="main-content w-full">
        <div className="page-header mb-4">
          <div>
            <Heading>{t('applications_title')}</Heading>
          </div>
        </div>
        <div className="md:flex md:flex-row-reverse">
          <div className="md:w-1/3 md:ml-4">
            <div className="card">
              <h3 className="card-title">{t('applications_subtitle')}</h3>
              <div className="card-body">
                <p>
                  {t('applications_open')}{' '}
                  <b>{platform.application.findCount(openApplications)}</b>
                </p>
                <p>
                  {t('applications_in_conversation')}{' '}
                  <b>
                    {platform.application.findCount(inConversationApplications)}
                  </b>
                </p>
                <p>
                  {t('applications_accepted')}{' '}
                  <b>{platform.application.findCount(approvedApplications)}</b>
                </p>
                <p>
                  {t('applications_rejected')}{' '}
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
                  content: (
                    <ApplicationList managedBy={undefined} status="open" />
                  ),
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
                    <ApplicationList managedBy={undefined} status="rejected" />
                  ),
                },
              ]}
            />
          </div>
        </div>
      </main>
    </>
  );
};

Applications.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default Applications;
