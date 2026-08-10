import Head from 'next/head';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import AgentChat from '../../components/AgentChat/AgentChat';
import Spinner from '../../components/ui/Spinner';
import PageNotAllowed from '../401';
import { useAuth } from '../../contexts/auth';

const AgentChatPage = () => {
  const t = useTranslations();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="main-content flex w-full max-w-none justify-center py-16">
        <Spinner />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('agent_chat_page_title')}</title>
        <meta
          name="description"
          content={t('agent_chat_page_meta_description')}
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="main-content w-full max-w-none px-0 py-0">
        <AgentChat />
      </main>
    </>
  );
};

AgentChatPage.getInitialProps = async (_context: NextPageContext) => {
  return {};
};

export default AgentChatPage;
