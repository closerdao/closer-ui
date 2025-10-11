import Head from 'next/head';
import { useRouter } from 'next/router';

import { ChangeEvent, useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  Input,
  ProgressBar,
} from '../../components/ui';
import Select from '../../components/ui/Select/Dropdown';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
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

const NationalityPage = ({ generalConfig }: Props) => {
  const router = useRouter();

  const { totalFiat, tokens, tokenSaleType } = router.query;

  const { isAuthenticated, isLoading, refetchUser } = useAuth();

  const [formData, setFormData] = useState({
    required: {
      name: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      nationality: '',
    },
    optional: {
      taxNo: '',
    },
  });
  const [errorMessage, setErrorMessage] = useState();
  const [canContinue, setCanContinue] = useState(false);
  const [isApiLoading, setApiIsLoading] = useState(false);


  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isFormValid()) {
      setCanContinue(true);
    } else {
      setCanContinue(false);
    }
  }, [formData]);

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
        country: formData.required.nationality,
      });
      await refetchUser();

      if (tokenSaleType === 'fiat') {
        router.push(
          `/token/bank-transfer?tokens=${tokens}&totalFiat=${totalFiat}`,
        );
      } else if (tokenSaleType === 'crypto') {
        router.push(`/token/checkout?tokens=${tokens}`);
      }
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
  const t = useTranslations();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const [countries, setCountries] = useState();
  const [isRestrictedNationality, setIsRestrictedNationality] = useState(false);
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
    if (
      formData.required.nationality === 'US'
    ) {
      setIsRestrictedNationality(true);
    } else {
      setIsRestrictedNationality(false);
    }
  }, [formData.required.nationality]);

  const goBack = async () => {
    router.push('/token/before-you-begin');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${t('token_sale_about_you_title')} - 
        ${t('token_sale_public_sale_announcement')} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
        🙍🏽 {t('token_sale_about_you_title')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <div>
            <fieldset className="flex flex-col gap-6 mb-16">
              <Select
                label={t('token_sale_label_nationality')}
                value={formData.required.nationality}
                options={countries || []}
                className="h-10"
                onChange={(value: string) =>
                  setFormData({
                    ...formData,
                    required: { ...formData.required, nationality: value },
                  })
                }
                isRequired
              />
              {isRestrictedNationality && (
                <ErrorMessage
                  error={t('token_sale_restricted_nationality_warning')}
                />
              )}

              <Input
                label={t('token_sale_label_name')}
                onChange={handleChange}
                value={formData.required.name}
                id="name"
                isRequired={true}
               
              />
              <Input
                label={t('token_sale_label_phone')}
                onChange={handleChange}
                value={formData.required.phone}
                id="phone"
                isRequired={true}
               
              />
              <Input
                label={t('token_sale_label_tax_no')}
                onChange={handleChange}
                value={formData.optional.taxNo}
                id="taxNo"
                isRequired={false}
               
              />
              <Input
                label={t('token_sale_label_address')}
                onChange={handleChange}
                value={formData.required.address}
                id="address"
                isRequired={true}
               
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
                
              />
              <Input
                label={t('token_sale_label_city')}
                onChange={handleChange}
                value={formData.required.city}
                id="city"
                isRequired={true}
                
              />
              {errorMessage && <ErrorMessage error={errorMessage} />}
              {error && <ErrorMessage error={parseMessageFromError(error)} />}
            </fieldset>

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
