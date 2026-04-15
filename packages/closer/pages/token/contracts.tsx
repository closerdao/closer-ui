import Head from 'next/head';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import ContractInteraction from '../../components/Dashboard/ContractInteraction';
import Heading from '../../components/ui/Heading';
import { loadLocaleData } from '../../utils/locale.helpers';
import { parseMessageFromError } from '../../utils/common';

const ContractsPage = () => {
  const t = useTranslations();

  return (
    <>
      <Head>
        <title>{t('contracts_page_title')}</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Heading level={2}>{t('contracts_page_title')}</Heading>
        <ContractInteraction />
      </div>
    </>
  );
};

ContractsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      messages: null,
    };
  }
};

export default ContractsPage;
