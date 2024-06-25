import Head from 'next/head';
import { useRouter } from 'next/router';

import { ChangeEvent, useContext, useEffect, useState } from 'react';

import Wallet from '../../components/Wallet';
import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  Input,
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
import { doesAddressMatchPattern, isInputValid } from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const YourInfoPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { nationality, tokens } = router.query;
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const { isWalletReady } = useContext(WalletState);
  const { isAuthenticated, isLoading, refetchUser, user } = useAuth();

  const [formData, setFormData] = useState({
    required: {
      name: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
    },
    optional: {
      taxNo: '',
    },
  });
  const [errorMessage, setErrorMessage] = useState();
  const [canContinue, setCanContinue] = useState(false);
  const [isApiLoading, setApiIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.kycPassed) {
      router.push(`/token/checkout?tokens=${tokens}`);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isWalletReady && isFormValid()) {
      setCanContinue(true);
    } else {
      setCanContinue(false);
    }
  }, [isWalletReady, formData]);

  const goBack = () => {
    router.push(
      `/token/token-counter?tokens=${tokens}&nationality=${nationality}`,
    );
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.id === 'taxNo') {
      setFormData({
        optional: { ...formData.optional, taxNo: event.target.value },
        required: { ...formData.required },
      });
    } else {
      setFormData({
        optional: { ...formData.optional },
        required: {
          ...formData.required,
          [event.target.id]: event.target.value,
        },
      });
    }
  };

  const handleNext = async () => {
    try {
      setApiIsLoading(true);
      await api.post('/auth/kyc', {
        legalName: formData.required.name,
        TIN: formData.optional.taxNo,
        address1: formData.required.address,
        address2: '',
        postalCode: formData.required.postalCode,
        city: formData.required.city,
        state: '',
        country: nationality,
      });
      refetchUser();
      router.push(`/token/checkout?tokens=${tokens}`);
    } catch (error) {
      setErrorMessage(parseMessageFromError(error));
    } finally {
      setApiIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (
      Object.values(formData.required).every((value) => value) &&
      isInputValid(formData.required.phone, 'phone') &&
      isInputValid(formData.optional.taxNo, 'taxNo') &&
      !doesAddressMatchPattern(formData.required.address, 'usAddress') &&
      !doesAddressMatchPattern(formData.required.address, 'swissAddress')
    ) {
      return true;
    }
    return false;
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' || !isWalletReady) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_your_info')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🤓 {t('token_sale_heading_your_info')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <Heading level={3} hasBorder={true}>
            ⭐ {t('token_sale_heading_required')}
          </Heading>

          <div>
            <fieldset className="flex flex-col gap-6 mb-16">
              <Input
                label={t('token_sale_label_name')}
                onChange={handleChange}
                value={formData.required.name}
                id="name"
                isRequired={true}
                className="mt-4"
              />
              <Input
                label={t('token_sale_label_phone')}
                onChange={handleChange}
                value={formData.required.phone}
                id="phone"
                isRequired={true}
                className="mt-4"
              />
              <Input
                label={t('token_sale_label_tax_no')}
                onChange={handleChange}
                value={formData.optional.taxNo}
                id="taxNo"
                isRequired={false}
                className="mt-4"
              />
              <Input
                label={t('token_sale_label_address')}
                onChange={handleChange}
                value={formData.required.address}
                id="address"
                isRequired={true}
                className="mt-4"
              />
              {(doesAddressMatchPattern(
                formData.required.address,
                'usAddress',
              ) ||
                doesAddressMatchPattern(
                  formData.required.address,
                  'swissAddress',
                )) && (
                <ErrorMessage
                  error={t('token_sale_restricted_nationality_warning')}
                />
              )}
              <Input
                label={t('token_sale_label_postal_code')}
                onChange={handleChange}
                value={formData.required.postalCode}
                id="postalCode"
                isRequired={true}
                className="mt-4"
              />
              <Input
                label={t('token_sale_label_city')}
                onChange={handleChange}
                value={formData.required.city}
                id="city"
                isRequired={true}
                className="mt-4"
              />
              {errorMessage && <ErrorMessage error={errorMessage} />}
            </fieldset>

            {isWalletEnabled && (
              <div className="mb-16">
                <Wallet />
              </div>
            )}

            <Button
              onClick={handleNext}
              isEnabled={canContinue && !isApiLoading}
              isLoading={isApiLoading}
            >
              {t('token_sale_button_continue')}
            </Button>
          </div>
        </main>
      </div>
    </>
  );
};

YourInfoPage.getInitialProps = async (context: NextPageContext) => {
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

export default YourInfoPage;
