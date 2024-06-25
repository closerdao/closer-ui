import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect } from 'react';

import { BackButton, Heading, ProgressBar } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenSaleSuccessPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { amountOfTokensPurchased, transactionId } = router.query;
  const { isAuthenticated, isLoading } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    gaEvent('token_success', {
      category: 'sales',
      label: 'token',
    });
  }, []);

  const goBack = async () => {
    router.push('/token');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' || !isWalletReady) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_checkout')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🎊 {t('token_sale_heading_success')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-12">
          <div className="">
            <Heading level={3} hasBorder={false}>
              {t('token_sale_success_message')}
            </Heading>
          </div>

          <div className='w-full h-[240px] bg-[url("/images/token-sale/token-success-artwork.jpg")] bg-no-repeat bg-center'>
            <Heading
              level={2}
              className="text-accent text-center"
            >{`${amountOfTokensPurchased} ${t(
              'token_sale_token_symbol',
            )}`}</Heading>
          </div>
          <Heading level={4} className="uppercase">
            {`${t('token_sale_success_purchase_number')}`}
            <p className="break-words">{transactionId}</p>
          </Heading>
        </main>
      </div>
    </>
  );
};

TokenSaleSuccessPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default TokenSaleSuccessPage;
