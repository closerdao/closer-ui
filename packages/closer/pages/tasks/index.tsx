import Head from 'next/head';
import Link from 'next/link';

import TaskList from '../../components/TaskList';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const Tasks = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('tasks_title')}</title>
      </Head>
      <main className="main-content intro">
        <div className="page-header">
          <Heading>{t('tasks_title')}</Heading>
          <div className="user-actions">
            <Link as="/tasks/create" href="/tasks/create" className="button">
              {t('tasks_link_create')}
            </Link>
          </div>
        </div>
        <TaskList />
      </main>
    </>
  );
};

Tasks.getInitialProps = async (context: NextPageContext) => {
  try {
    return {
    };
  } catch (err: unknown) {
    return {
      };
  }
};

export default Tasks;
