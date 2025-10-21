import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect } from 'react';

import Wallet from '../../components/Wallet';
import { BackButton, Button, Heading, ProgressBar } from '../../components/ui';

import { Info } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
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
  const { user } = useAuth();

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

    // Track token basket size
    if (amountOfTokensPurchased) {
      api.post('/metric', {
        event: 'token-sale-success',
        value: 'token-sale',
        point: Number(amountOfTokensPurchased),
        category: 'engagement',
      });
    }
  }, [amountOfTokensPurchased]);

  const handleNext = () => {
    router.push('/');
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
        ${t('token_sale_heading_checkout')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          {tokenSaleType !== 'fiat' ? (
            <>🤝🏼 {t('token_sale_success_message')}</>
          ) : (
            <>🤝🏼 {t('token_sale_bank_transfer_success_bank_transfer')}</>
          )}
        </Heading>
        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-12">
          {tokenSaleType !== 'fiat' ? (
            <div className=" flex flex-col gap-12">
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
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <p>{t('token_sale_bank_transfer_success_intro')}</p>
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
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <div>
                  <span className="font-semibold">{t('oasa_beneficiary')}</span>
                  <span className="ml-2">{t('oasa_beneficiary_name')}</span>
                </div>
                <div>
                  <span className="font-semibold">{t('oasa_iban')}</span>
                  <span className="ml-2">{t('oasa_iban_value')}</span>
                </div>
                <div>
                  <span className="font-semibold">{t('oasa_bic')}</span>
                  <span className="ml-2">{t('oasa_bic_value')}</span>
                </div>
                <div>
                  <span className="font-semibold">{t('oasa_address')}</span>
                  <div className="">{t('oasa_address_value')}</div>
                </div>
                <div>
                  <span className="font-semibold">{t('oasa_memo')}</span>
                  <div className="font-mono">{memoCode as string}</div>
                </div>
              </div>

              <p>{t('token_sale_bank_transfer_success_info')}</p>

              {!user?.walletAddress && (
                <div className="flex  gap-4 bg-neutral p-6 pb-8 rounded-lg">
                  <Info className="flex-shrink-0 w-8 h-8  text-gray-400" />
                  <div className="flex flex-col gap-4 pt-0.5">
                    <p>{t('token_sale_bank_transfer_no_wallet_intro')}</p>

                    <p>
                      {' '}
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

              <Button onClick={handleNext} className="mt-6">
                {t('token_sale_bank_transfer_success_back_to_homepage')}
              </Button>
            </div>
          )}
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
