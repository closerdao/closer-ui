import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  Checkbox,
  ErrorMessage,
  Heading,
  Input,
  ProgressBar,
} from '../../components/ui';

import { isValid } from 'iban-ts';
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
  const [ibanError, setIbanError] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [isTokenTermsAccepted, setIsTokenTermsAccepted] = useState(false);
  const [existingCharges, setExistingCharges] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateIban = (iban: string) => {
    if (!iban.trim()) {
      setIbanError(null);
      return true;
    }

    const isValidIban = isValid(iban);
    if (!isValidIban) {
      setIbanError(t('validation_invalid_iban'));
      return false;
    }

    setIbanError(null);
    return true;
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIbanNumber(value);
    validateIban(value);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }

    if (isAuthenticated && !isLoading && user) {
      (async () => {
        const res = await api.get('/charge', {
          params: {
            where: {
              type: 'fiatTokenSale',
              status: 'pending-payment',
              createdBy: user?._id,
            },
            limit: 100,
            sort: '-date',
          },
        });
        setExistingCharges(res?.data?.results);
        console.log('res=', res?.data?.results);
      })();
    }
  }, [isAuthenticated, isLoading]);

  const goBack = async () => {
    router.push('/token/');
  };

  const handleNext = async () => {
    try {
      if (existingCharges && existingCharges.length > 0) {
        await Promise.all(
          existingCharges.map((charge) => api.delete(`/charge/${charge._id}`)),
        );
      }
    } catch (error) {
      setError(t('token_sale_bank_transfer_delete_error'));
      console.error('error with deleting existing charges:', error);
    }

    try {
      setIsApiLoading(true);
      await api.post('/token/bank-transfer-application', {
        ibanNumber: ibanNumber.replace(/\s/g, ''),
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
      setError(parseMessageFromError(error));
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
          <p>
            {t('token_sale_bank_transfer_intro', {
              tokens: tokens as string,
              totalFiat: totalFiat as string,
            })}
          </p>

          {existingCharges && (
            <div className="mt-6 bg-yellow-100 p-4 rounded-lg space-y-2">
              <p className="font-bold ">
                {t('token_sale_bank_transfer_existing_application_title')}
              </p>

              <p>
                {t('token_sale_bank_transfer_existing_application_description')}
              </p>
            </div>
          )}
          <Heading level={3} hasBorder={true}>
            💰 {t('token_sale_bank_transfer_next_steps')}
          </Heading>

          <div className="flex flex-col gap-12">
            <Input
              label={t('token_sale_bank_transfer_which_account')}
              onChange={handleIbanChange}
              value={ibanNumber}
              id="ibanNumber"
              isRequired={true}
              placeholder={t('token_sale_bank_transfer_iban_placeholder')}
              validation={ibanError ? 'invalid' : undefined}
              customValidationError={ibanError || undefined}
              successMessage={
                ibanNumber && !ibanError
                  ? t('validation_valid_iban')
                  : undefined
              }
            />

            <div className="flex items-start gap-1">
              <Checkbox
                id="token-terms-agreement"
                isChecked={isTokenTermsAccepted}
                onChange={() => setIsTokenTermsAccepted(!isTokenTermsAccepted)}
              />
              <label htmlFor="token-terms-agreement">
                {t.rich('subscriptions_citizen_agree_to_token_terms', {
                  link1: (chunks) => (
                    <a
                      href="https://docs.google.com/document/d/1kz4SH1UVWhamniqUW4GWmFOU0nmXyhpAzUJwFTW0ybs/edit?tab=t.0"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {chunks}
                    </a>
                  ),
                  link2: (chunks) => (
                    <a
                      href="https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </label>
            </div>

            <ErrorMessage error={error} />

            <Button
              onClick={handleNext}
              isLoading={isApiLoading}
              isEnabled={
                isValid(ibanNumber) &&
                !isApiLoading &&
                isTokenTermsAccepted &&
                !ibanError
              }
            >
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
