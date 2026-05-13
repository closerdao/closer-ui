import Head from 'next/head';
import { useRouter } from 'next/router';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  Input,
  ProgressBar,
} from '../../components/ui';
import Select from '../../components/ui/Select/Dropdown';

import { useTranslations } from 'next-intl';

import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { useSalePaidRedirect } from '../../hooks/useSalePaidRedirect';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { logMetric } from '../../utils/metrics';
import { fetchTokenSaleQuantityForMetric } from '../../utils/tokenSale.helpers';
import { doesAddressMatchPattern, isInputValid } from '../../utils/helpers';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const NationalityPage = ({ generalConfig }: Props) => {
  const router = useRouter();

  useSalePaidRedirect();

  const { tokenSaleType, saleId } = router.query;

  const { isAuthenticated, isLoading, refetchUser, user } = useAuth();

  const didPrefillFromKyc = useRef(false);
  const kycPageMetricLoggedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const sid = String(saleId ?? '').trim();
    const typeKey = Array.isArray(tokenSaleType)
      ? tokenSaleType[0]
      : String(tokenSaleType ?? '');
    const dedupeKey = `${sid}:${typeKey}`;
    if (!sid || kycPageMetricLoggedRef.current === dedupeKey) return;
    kycPageMetricLoggedRef.current = dedupeKey;
    void logMetric({
      event: 'token-kyc-page-viewed',
      category: 'token',
      value: 'kyc-view',
    });
  }, [router.isReady, saleId, tokenSaleType]);

  useEffect(() => {
    if (didPrefillFromKyc.current || !user) return;
    const k = user.kycData;
    if (
      !k ||
      (!k.legalName?.trim() &&
        !k.country?.trim() &&
        !k.address1?.trim())
    ) {
      return;
    }
    didPrefillFromKyc.current = true;
    setFormData({
      required: {
        name: k.legalName?.trim() || '',
        phone: user.phone?.trim() || '',
        address: k.address1?.trim() || '',
        postalCode: k.postalCode?.trim() || '',
        city: k.city?.trim() || '',
        nationality: k.country?.trim() || '',
      },
      optional: {
        taxNo: k.TIN?.trim() || '',
      },
    });
  }, [user]);

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
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
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

      const sid = String(saleId ?? '').trim();
      const point = sid ? await fetchTokenSaleQuantityForMetric(sid) : 0;

      if (tokenSaleType === 'fiat') {
        void logMetric({
          event: 'kyc-submit-fiat',
          category: 'token',
          value: 'kyc-fiat', point: point,
        });
        router.push(
          `/token/bank-transfer?saleId=${encodeURIComponent(sid)}`,
        );
      } else if (tokenSaleType === 'crypto') {
        void logMetric({
          event: 'kyc-submit-crypto',
          category: 'token',
          value: 'kyc-crypto', point: point,
        });
        router.push(`/token/checkout?saleId=${encodeURIComponent(sid)}`);
      } else if (sid) {
        void logMetric({
          event: 'kyc-submit-checkout',
          category: 'token',
          value: 'kyc-checkout', point: point,
        });
        router.push(`/token/checkout?saleId=${encodeURIComponent(sid)}`);
      }
    } catch (error) {
      const sid = String(saleId ?? '').trim();
      const fallbackPoint = sid ? await fetchTokenSaleQuantityForMetric(sid) : 0;
      void logMetric({
        event: 'kyc-submit-error',
        category: 'token',
        value: 'error', point: fallbackPoint,
      });
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
  const [error, setError] = useState<string | undefined>(undefined);

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

export default NationalityPage;
