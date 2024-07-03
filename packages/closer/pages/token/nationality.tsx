import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
} from '../../components/ui';
import Select from '../../components/ui/Select/Dropdown';

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

const NationalityPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const [nationality, setNationality] = useState('');
  const [countries, setCountries] = useState();
  const [isRestictedNationality, setIsRestictedNationality] = useState(false);

  const [error, setError] = useState();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const getContries = async () => {
      const countryList: any = [];
      try {
        const res = await api.get('/meta/countries');
        res.data.results.forEach((country: any) => {
          countryList.push({ label: country.name, value: country.code });
        });
        setCountries(countryList);
      } catch (error) {
        setError(parseMessageFromError(error));
      }
    };
    getContries();
  }, []);

  useEffect(() => {
    if (nationality === 'US' || nationality === 'CH') {
      setIsRestictedNationality(true);
    } else {
      setIsRestictedNationality(false);
    }
  }, [nationality]);

  const goBack = async () => {
    router.push('/token/');
  };

  const handleNext = async () => {
    router.push(`/token/token-counter?nationality=${nationality}`);
  };

  const handleChange = (value: string) => {
    setNationality(value);
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' || !isWalletReady) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_heading_nationality')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {t('token_sale_heading_nationality')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <fieldset className="flex flex-col gap-12 min-h-[250px]">
            <Select
              label={t('token_sale_label_nationality')}
              value={nationality}
              options={countries || []}
              className="mt-8"
              onChange={handleChange}
              isRequired
            />

            {isRestictedNationality && (
              <ErrorMessage
                error={t('token_sale_restricted_nationality_warning')}
              />
            )}
            {error && <ErrorMessage error={error} />}

            <Button
              onClick={handleNext}
              isEnabled={nationality !== '' && !isRestictedNationality}
              className="mt-10"
            >
              {t('token_sale_button_continue')}
            </Button>
          </fieldset>
        </main>
      </div>
    </>
  );
};

NationalityPage.getInitialProps = async (context: NextPageContext) => {
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

export default NationalityPage;
