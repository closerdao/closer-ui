import Head from 'next/head';
import Link from 'next/link';

import { useTranslations } from 'next-intl';

import ErrorPage from '../components/ErrorPage';

const Page404 = ({ error }: { error?: string }) => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('404_title')}</title>
      </Head>
      <ErrorPage code="404" title={t('404_title')} error={error}>
        <Link href="/" className="btn-primary">
          {t('404_go_back')}
        </Link>
      </ErrorPage>
    </>
  );
};

export async function getStaticProps() {
  return {
    props: {},
  };
}

export default Page404;
