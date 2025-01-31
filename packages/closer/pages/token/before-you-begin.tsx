import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef } from 'react';

import Wallet from '../../components/Wallet';
import {
  BackButton,
  Button,
  Card,
  Heading,
  ProgressBar,
} from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

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

const TokenSaleBeforeYouBeginPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const { isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const hasComponentRendered = useRef(false);


  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'open-flow',
            value: 'token-sale',
            point: 0,
            category: 'engagement',
          });

        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading]);

  const handleNext = async () => {
    if (user && user.kycPassed === true) {
      router.push('/token/token-counter');
    } else {
      router.push('/token/nationality');
    }
  };

  const goBack = async () => {
    router.push('/token');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_before_you_begin')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {t('token_sale_heading_before_you_begin')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-4">
          <p>{t('token_sale_before_you_begin_text_1')}</p>
          <p>{t('token_sale_before_you_begin_text_2')}</p>
          <p>{t('token_sale_before_you_begin_text_3')}</p>
          <div>
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_before_you_begin_checklist_heading')}
            </Heading>
            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {t('token_sale_before_you_begin_checklist_1')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {t('token_sale_before_you_begin_checklist_2')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {t('token_sale_before_you_begin_checklist_3')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {t('token_sale_before_you_begin_checklist_4')}
              </li>
            </ul>
          </div>

          <div>
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_before_you_begin_need_help_heading')}
            </Heading>
            <ul>
              <li className="mb-1.5">
                <Card className="mb-4">
                  <Link
                    className="text-accent font-bold underline"
                    href='/pdf/Token-Sale-Support.pdf'
                  >
                    📄 {t('token_sale_complete_guide')}
                  </Link>
                </Card>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={t('token_sale_before_you_begin_guide_1_link')}
                >
                  {t('token_sale_before_you_begin_guide_1')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={t('token_sale_before_you_begin_guide_2_link')}
                >
                  {t('token_sale_before_you_begin_guide_2')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href='https://ramp.network/buy'
                >
                  {t('token_sale_before_you_begin_guide_3')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href='https://v2.app.squidrouter.com/'
                >
                  {t('token_sale_before_you_begin_guide_5')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={t('token_sale_before_you_begin_guide_link_contact')}
                >
                  {t('token_sale_before_you_begin_guide_4')}
                </Link>
              </li>
            </ul>
          </div>

          {isWalletEnabled && (
            <div className="my-8">
              <Wallet />
            </div>
          )}

          <Button onClick={handleNext} isEnabled={isWalletReady}>
            {t('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

TokenSaleBeforeYouBeginPage.getInitialProps = async (
  context: NextPageContext,
) => {
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

export default TokenSaleBeforeYouBeginPage;
