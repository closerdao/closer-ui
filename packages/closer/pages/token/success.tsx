import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import Card from '../../components/ui/Card';
import Wallet from '../../components/Wallet';
import Button from '../../components/ui/Button';

import { Info } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const CELEBRATION_DURATION_MS = 2800;
const OVERLAY_FADE_MS = 500;

interface Props {
  generalConfig: GeneralConfig | null;
}

const TokenSaleSuccessPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { user } = useAuth();
  const [showCelebration, setShowCelebration] = useState(true);

  const { memoCode } = router.query;
  const {
    tokenSaleType,
    totalFiat,
    ibanNumber,
    amountOfTokensPurchased,
    transactionId,
  } = router.query;
  const { isAuthenticated, isLoading } = useAuth();

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

    if (amountOfTokensPurchased) {
      api.post('/metric', {
        event: 'token-sale-success',
        value: 'token-sale',
        point: Number(amountOfTokensPurchased),
        category: 'engagement',
      });
    }
  }, [amountOfTokensPurchased]);

  useEffect(() => {
    const timer = setTimeout(
      () => setShowCelebration(false),
      CELEBRATION_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    router.push('/');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  const successTitle =
    tokenSaleType !== 'fiat'
      ? t('token_sale_success_message')
      : t('token_sale_bank_transfer_success_bank_transfer');

  return (
    <>
      <Head>
        <title>{`${t('token_sale_heading_success')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <div
        aria-hidden
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
        style={{
          opacity: showCelebration ? 1 : 0,
          pointerEvents: showCelebration ? 'auto' : 'none',
          transition: `opacity ${OVERLAY_FADE_MS}ms ease-out`,
        }}
      >
        <div className="confirmation-celebration__particles">
          {[...Array(24)].map((_, i) => (
            <span
              key={i}
              className="confirmation-celebration__particle"
              style={{ animationDelay: `${i * 0.04}s` }}
            />
          ))}
        </div>
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-success"
            style={{
              animation: showCelebration
                ? 'confirmation-check-pop 0.5s ease-out forwards'
                : 'none',
            }}
          >
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-center text-2xl font-semibold text-foreground">
            {successTitle}
          </h2>
        </div>
      </div>
      <style jsx global>{`
        @keyframes confirmation-check-pop {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .confirmation-celebration__particles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .confirmation-celebration__particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 8px;
          height: 8px;
          margin-left: -4px;
          margin-top: -4px;
          border-radius: 2px;
          animation: confirmation-confetti 1.8s ease-out forwards;
          opacity: 0;
        }
        .confirmation-celebration__particle:nth-child(1) {
          background: #58b741;
          --tx: 120px;
          --ty: -80px;
          --r: 180deg;
        }
        .confirmation-celebration__particle:nth-child(2) {
          background: #e4427d;
          --tx: -100px;
          --ty: -100px;
          --r: -120deg;
        }
        .confirmation-celebration__particle:nth-child(3) {
          background: #E8AB1B;
          --tx: 90px;
          --ty: 100px;
          --r: 90deg;
        }
        .confirmation-celebration__particle:nth-child(4) {
          background: #1b3bc3;
          --tx: -130px;
          --ty: 60px;
          --r: -60deg;
        }
        .confirmation-celebration__particle:nth-child(5) {
          background: #58b741;
          --tx: 0;
          --ty: -150px;
          --r: 45deg;
        }
        .confirmation-celebration__particle:nth-child(6) {
          background: #e4427d;
          --tx: 140px;
          --ty: 20px;
          --r: 200deg;
        }
        .confirmation-celebration__particle:nth-child(7) {
          background: #E8AB1B;
          --tx: -80px;
          --ty: -120px;
          --r: -90deg;
        }
        .confirmation-celebration__particle:nth-child(8) {
          background: #1b3bc3;
          --tx: -110px;
          --ty: -50px;
          --r: 120deg;
        }
        .confirmation-celebration__particle:nth-child(9) {
          background: #58b741;
          --tx: 70px;
          --ty: -130px;
          --r: -30deg;
        }
        .confirmation-celebration__particle:nth-child(10) {
          background: #e4427d;
          --tx: -70px;
          --ty: 110px;
          --r: 150deg;
        }
        .confirmation-celebration__particle:nth-child(11) {
          background: #E8AB1B;
          --tx: 110px;
          --ty: -60px;
          --r: -180deg;
        }
        .confirmation-celebration__particle:nth-child(12) {
          background: #1b3bc3;
          --tx: 50px;
          --ty: 130px;
          --r: 60deg;
        }
        .confirmation-celebration__particle:nth-child(13) {
          background: #58b741;
          --tx: -140px;
          --ty: -30px;
          --r: -150deg;
        }
        .confirmation-celebration__particle:nth-child(14) {
          background: #e4427d;
          --tx: 80px;
          --ty: 90px;
          --r: 30deg;
        }
        .confirmation-celebration__particle:nth-child(15) {
          background: #E8AB1B;
          --tx: -90px;
          --ty: 80px;
          --r: -45deg;
        }
        .confirmation-celebration__particle:nth-child(16) {
          background: #1b3bc3;
          --tx: 130px;
          --ty: -100px;
          --r: 100deg;
        }
        .confirmation-celebration__particle:nth-child(17) {
          background: #58b741;
          --tx: -50px;
          --ty: -140px;
          --r: -100deg;
        }
        .confirmation-celebration__particle:nth-child(18) {
          background: #e4427d;
          --tx: 100px;
          --ty: 70px;
          --r: 0deg;
        }
        .confirmation-celebration__particle:nth-child(19) {
          background: #E8AB1B;
          --tx: -120px;
          --ty: 100px;
          --r: 75deg;
        }
        .confirmation-celebration__particle:nth-child(20) {
          background: #1b3bc3;
          --tx: 60px;
          --ty: -110px;
          --r: -75deg;
        }
        .confirmation-celebration__particle:nth-child(21) {
          background: #58b741;
          --tx: -60px;
          --ty: -90px;
          --r: 160deg;
        }
        .confirmation-celebration__particle:nth-child(22) {
          background: #e4427d;
          --tx: 150px;
          --ty: 50px;
          --r: -160deg;
        }
        .confirmation-celebration__particle:nth-child(23) {
          background: #E8AB1B;
          --tx: -150px;
          --ty: -70px;
          --r: 40deg;
        }
        .confirmation-celebration__particle:nth-child(24) {
          background: #1b3bc3;
          --tx: 40px;
          --ty: -120px;
          --r: -40deg;
        }
        @keyframes confirmation-confetti {
          0% {
            opacity: 1;
            transform: translate(0, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) rotate(var(--r));
          }
        }
      `}</style>
      <div className="max-w-screen-sm mx-auto p-4 md:p-8">
        <div className="mt-16 flex flex-col gap-16 flex-nowrap">
          <div className="flex flex-col items-center gap-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success"
              aria-hidden
            >
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-center text-2xl font-semibold text-foreground">
              {successTitle}
            </h1>
            <p className="text-center text-foreground/90 max-w-md leading-relaxed">
              {tokenSaleType !== 'fiat'
                ? t('token_sale_success_lead')
                : t('token_sale_bank_transfer_success_intro')}
            </p>
          </div>
          {tokenSaleType !== 'fiat' ? (
            <>
              <Card className="p-3 gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="card-feature shrink-0">
                    {t('token_sale_checkout_your_purchse')}
                  </p>
                  <p className="text-sm font-medium">
                    {amountOfTokensPurchased}{' '}
                    {t('token_sale_token_symbol')}
                  </p>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="card-feature">
                    {t('token_sale_success_purchase_number')}
                  </p>
                  <p className="text-sm break-all font-mono">{transactionId}</p>
                </div>
              </Card>
              <Button onClick={handleNext}>
                {t('token_sale_bank_transfer_success_back_to_homepage')}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-6">
                <p>
                  {t('token_sale_bank_transfer_success_instructions_1', {
                    totalFiat: `€${totalFiat as string}`,
                  })}{' '}
                  <b>{process.env.NEXT_PUBLIC_CLOSER_IBAN}</b>{' '}
                  {t('token_sale_bank_transfer_success_instructions_2')}{' '}
                  {ibanNumber?.slice(-4)}
                </p>

                <div className="bg-yellow-100 font-bold p-4 rounded-lg space-y-2">
                  {t(
                    'subscriptions_citizen_finance_tokens_payment_memo_important',
                    { memoCode: memoCode as string },
                  )}
                </div>
                <Card className="p-3 gap-2">
                  <div>
                    <p className="card-feature">{t('oasa_beneficiary')}</p>
                    <p className="text-sm">{t('oasa_beneficiary_name')}</p>
                  </div>
                  <div>
                    <p className="card-feature">{t('oasa_iban')}</p>
                    <p className="text-sm">{t('oasa_iban_value')}</p>
                  </div>
                  <div>
                    <p className="card-feature">{t('oasa_bic')}</p>
                    <p className="text-sm">{t('oasa_bic_value')}</p>
                  </div>
                  <div>
                    <p className="card-feature">{t('oasa_address')}</p>
                    <p className="text-sm">{t('oasa_address_value')}</p>
                  </div>
                  <div>
                    <p className="card-feature">{t('oasa_memo')}</p>
                    <p className="text-sm font-mono">{memoCode as string}</p>
                  </div>
                </Card>

                <p>{t('token_sale_bank_transfer_success_info')}</p>

                {!user?.walletAddress && (
                  <div className="flex gap-4 bg-neutral p-6 pb-8 rounded-lg">
                    <Info className="flex-shrink-0 w-8 h-8 text-gray-400" />
                    <div className="flex flex-col gap-4 pt-0.5">
                      <p>{t('token_sale_bank_transfer_no_wallet_intro')}</p>
                      <p>
                        {t.rich('token_sale_bank_transfer_no_wallet_step_1', {
                          link: (chunks) => (
                            <a
                              href="https://grimsnas.se"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent underline"
                            >
                              {chunks}
                            </a>
                          ),
                        })}
                      </p>
                      <p>{t('token_sale_bank_transfer_no_wallet_step_2')}</p>
                      <Wallet />
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleNext}>
                {t('token_sale_bank_transfer_success_back_to_homepage')}
              </Button>
            </>
          )}
        </div>
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
