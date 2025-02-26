import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  Heading,
  Input,
  ProgressBar,
} from '../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS_BANK_TRANSFER } from '../../constants';
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

const BankTransferPage = ({ generalConfig }: Props) => {
  const t = useTranslations();

  const router = useRouter();
  const { totalFiat, tokens } = router.query;

  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const { isAuthenticated, isLoading, user } = useAuth();

  const [ibanNumber, setIbanNumber] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  const goBack = async () => {
    router.push('/token/');
  };

  const handleNext = async () => {

    try {
      setIsApiLoading(true);
      await api.post('/token/bank-transfer-application', {
        ibanNumber, 
        totalFiat,
        userId: user?._id,
        tokens,
      });
      await api.post('/metric', {
        event: 'apply',
        value: 'token-sale-fiat',
        point: 0,
        category: 'engagement',
      });
      router.push(
        `/token/success?totalFiat=${totalFiat}&tokenSaleType=fiat&ibanNumber=${ibanNumber}`,
      );
    } catch (error) {
      console.error('error with bank transfer:', error);
    } finally {
      setIsApiLoading(false);
    }
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
          🤑 {t('token_sale_bank_transfer_title')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS_BANK_TRANSFER} />

        <main className="pt-14 pb-24">
          <p>{t('token_sale_bank_transfer_intro', { tokens: tokens as string, totalFiat: totalFiat as string })}</p>
          <Heading level={3} hasBorder={true}>
            💰 {t('token_sale_bank_transfer_next_steps')}
          </Heading>

          <div className="flex flex-col gap-12">
            <Input
              label={t('token_sale_bank_transfer_which_account')}
              onChange={(e) => setIbanNumber(e.target.value)}
              value={ibanNumber}
              id="ibanNumber"
              isRequired={true}
              placeholder={t('token_sale_bank_transfer_iban_placeholder')}
            />

            <Button onClick={handleNext} isLoading={isApiLoading} isEnabled={ibanNumber.length > 0 && !isApiLoading}>
              {t('token_sale_button_continue')} 
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

BankTransferPage.getInitialProps = async (context: NextPageContext) => {
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

export default BankTransferPage;
