import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import Wallet from '../../components/Wallet';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { GeneralConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { logMetric } from '../../utils/metrics';
import { fetchTokenSaleQuantityForMetric } from '../../utils/tokenSale.helpers';
import { getReserveTokenDisplay } from '../../utils/config.utils';
import PageNotFound from '../not-found';

const ChecklistCryptoPage = () => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const defaultConfig = useConfig();
  const reserveToken = getReserveTokenDisplay(defaultConfig);
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();

  useSalePaidRedirect();

  const { saleId } = router.query;

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const { isLoading, user } = useAuth();
  const { isWalletReady, balanceCeloAvailable, balanceCeurAvailable } =
    useContext(WalletState);

  const doesHaveCelo = balanceCeloAvailable > 0.1;
  const doesHaveCeur = balanceCeurAvailable > 250;
  const isChecklistComplete = isWalletReady && doesHaveCelo && doesHaveCeur;
  const [visibleChecks, setVisibleChecks] = useState([false, false, false]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, isLoading]);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setVisibleChecks((prev) => [true, prev[1], prev[2]]), 1000),
      window.setTimeout(() => setVisibleChecks((prev) => [prev[0], true, prev[2]]), 1500),
      window.setTimeout(() => setVisibleChecks((prev) => [prev[0], prev[1], true]), 2000),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const handleNext = async () => {
    const sid = String(saleId ?? '').trim();
    const point = sid ? await fetchTokenSaleQuantityForMetric(sid) : 0;
    void logMetric({
      event: 'continue-checklist-crypto',
      value: 'token-sale',
      point,
    });
    const encodedSaleId = encodeURIComponent(sid);
    router.push(
      `/token/nationality?tokenSaleType=crypto&saleId=${encodedSaleId}`,
    );
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
          {`✓ ${t('token_sale_before_you_begin_checklist_heading')}`}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-0 pb-24 flex flex-col gap-4">
          <div>
            <ul className="flex flex-col gap-2">
              <li
                className="mb-1.5"
              >
                <span
                  className={`mr-2 mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] align-top transition-all duration-300 ${
                    isWalletReady
                      ? (visibleChecks[0] ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
                      : 'opacity-100 scale-100'
                  } ${
                    isWalletReady
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-300 bg-gray-100 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="inline">
                  {isWalletReady
                    ? t('token_sale_before_you_begin_checklist_1')
                    : t('token_sale_before_you_begin_checklist_1_connect')}
                </span>
              </li>
              <li
                className="mb-1.5"
              >
                <span
                  className={`mr-2 mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] align-top transition-all duration-300 ${
                    doesHaveCelo
                      ? (visibleChecks[1] ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
                      : 'opacity-100 scale-100'
                  } ${
                    doesHaveCelo
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-300 bg-gray-100 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="inline">
                  {doesHaveCelo
                    ? t('token_sale_before_you_begin_checklist_2_gas_fees')
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
                </span>
              </li>

              <li
                className="mb-1.5"
              >
                <span
                  className={`mr-2 mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] align-top transition-all duration-300 ${
                    doesHaveCeur
                      ? (visibleChecks[2] ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
                      : 'opacity-100 scale-100'
                  } ${
                    doesHaveCeur
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-300 bg-gray-100 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="inline">
                  {doesHaveCeur ? (
                    t('token_sale_before_you_begin_checklist_3_hold_eurm')
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
                </span>
              </li>
            </ul>
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium text-black text-center ${
                isChecklistComplete
                  ? 'border border-accent/30 bg-accent-light'
                  : 'border border-gray-200 bg-gray-50'
              }`}
            >
              {isChecklistComplete
                ? t('token_sale_checklist_status_ready')
                : t('token_sale_checklist_status_incomplete')}
            </p>
          </div>

          <span className="relative inline-flex">
            <Button onClick={handleNext} isEnabled={isChecklistComplete}>
              {t('token_sale_button_continue')}
            </Button>
            {isChecklistComplete && (
              <span className="absolute inset-0 pointer-events-none" aria-hidden>
                <span
                  className="absolute animate-sparkle-float text-[10px] left-1/2 top-0"
                  style={{ animationDelay: '0s' }}
                >
                  ✦
                </span>
                <span
                  className="absolute animate-sparkle-float text-[8px] left-[20%] top-[10%] text-accent"
                  style={{ animationDelay: '0.6s' }}
                >
                  ✧
                </span>
                <span
                  className="absolute animate-sparkle-float text-[9px] left-[75%] top-[5%] text-accent"
                  style={{ animationDelay: '1.1s' }}
                >
                  ✦
                </span>
              </span>
            )}
          </span>

          {isWalletEnabled && (
            <div className="mt-8 mb-4">
              <Wallet />
            </div>
          )}

          <div>
            <Heading level={3} hasBorder={true}>
              ? {t('token_sale_before_you_begin_need_help_heading')}
            </Heading>
            <ul>
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
        </main>
      </div>
    </>
  );
};

export default ChecklistCryptoPage;
