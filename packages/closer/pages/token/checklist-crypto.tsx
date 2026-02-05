import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useRef } from 'react';

import Wallet from '../../components/Wallet';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { getReserveTokenDisplay } from '../../utils/config.utils';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const ChecklistCryptoPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const reserveToken = getReserveTokenDisplay(defaultConfig);
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();

  const { tokens } = router.query;

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const { isLoading, user } = useAuth();
  const { isWalletReady, balanceCeloAvailable, balanceCeurAvailable } =
    useContext(WalletState);

  const hasComponentRendered = useRef(false);

  const doesHaveCelo = balanceCeloAvailable > 0.1;
  const doesHaveCeur = balanceCeurAvailable > 250;

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
      router.push(
        `/token/checkout?tokens=${encodeURIComponent(tokens as string)}`,
      );
    } else {
      router.push(
        `/token/nationality?tokens=${encodeURIComponent(tokens as string)}`,
      );
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
        ${t('token_sale_bank_transfer_title')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          {t('token_sale_bank_transfer_title')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-4">
          <p>{t('token_sale_before_you_begin_text_1')}</p>
          <p>{t('token_sale_before_you_begin_text_2')}</p>

          <ul className="list-disc pl-6 mb-1.5">
            <li className="  mb-1.5">{t('token_sale_how_1')}</li>
            <li className=" mb-1.5">{t('token_sale_how_2')}</li>
            <li className=" mb-1.5">{t('token_sale_how_3')}</li>
          </ul>

          <div>
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_before_you_begin_checklist_heading')}
            </Heading>

            <ul>
              <li
                className={`${
                  isWalletReady
                    ? 'bg-[url(/images/subscriptions/bullet.svg)]'
                    : 'bg-[url(/images/subscriptions/bullet-inactive.svg)]'
                } bg-[length:16px_16px] bg-[top_5px_left]  bg-no-repeat pl-6 mb-1.5`}
              >
                {isWalletReady
                  ? t('token_sale_before_you_begin_checklist_1')
                  : t('token_sale_before_you_begin_checklist_1_connect')}
              </li>
              <li
                className={`${
                  doesHaveCelo
                    ? 'bg-[url(/images/subscriptions/bullet.svg)]'
                    : 'bg-[url(/images/subscriptions/bullet-inactive.svg)]'
                } bg-[length:16px_16px] bg-[top_5px_left]  bg-no-repeat pl-6 mb-1.5`}
              >
                {doesHaveCelo
                  ? t('token_sale_before_you_begin_checklist_2')
                  : t.rich(
                      'token_sale_before_you_begin_checklist_2_buy_on_binance_or_coinbase',
                      {
                        link: (chunks) => (
                          <a
                            className="underline"
                            href="https://www.binance.com/en/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        ),
                        link2: (chunks) => (
                          <a
                            className="underline"
                            href="https://www.coinbase.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {chunks}
                          </a>
                        ),
                      },
                    )}
              </li>

              <li
                className={`${
                  doesHaveCeur
                    ? 'bg-[url(/images/subscriptions/bullet.svg)]'
                    : 'bg-[url(/images/subscriptions/bullet-inactive.svg)]'
                } bg-[length:16px_16px] bg-[top_5px_left]  bg-no-repeat pl-6 mb-1.5`}
              >
                {doesHaveCeur ? (
                  t('token_sale_before_you_begin_checklist_3', { reserveToken })
                ) : (
                  <a
                    className="underline"
                    href="https://app.squidrouter.com/?chains=42220%2C42220&tokens=0x471ece3750da237f93b8e339c536989b8978a438%2C0xd8763cba276a3738e6de85b4b3bf5fded6d6ca73"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('token_sale_before_you_begin_checklist_3_cta', { reserveToken })}
                  </a>
                )}
              </li>
            </ul>
          </div>

          <div>
            <Heading level={3} hasBorder={true}>
              💰 {t('token_sale_before_you_begin_need_help_heading')}
            </Heading>
            <ul>
              {/* <li className="mb-1.5">
                <Card className="mb-4">
                  <Link
                    className="text-accent font-bold underline"
                    href='/pdf/Token-Sale-Support.pdf'
                  >
                    📄 {t('token_sale_complete_guide')}
                  </Link>
                </Card>
              </li> */}
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
                  href="https://t.me/+bW0K8E7ZGVE4ZjBh"
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

ChecklistCryptoPage.getInitialProps = async (context: NextPageContext) => {
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

export default ChecklistCryptoPage;
