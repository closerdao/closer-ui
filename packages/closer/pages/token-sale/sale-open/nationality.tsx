import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
} from '../../../components/ui';
import Select from '../../../components/ui/Select/Dropdown';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const NationalityPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [nationality, setNationality] = useState('');
  const [countries, setCountries] = useState();
  const [isRestictedNationality, setIsRestictedNationality] = useState(false);

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
        console.log(error);
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
    router.push('/token-sale/sale-open/');
  };

  const handleNext = async () => {
    router.push(
      `/token-sale/sale-open/token-counter?nationality=${nationality}`,
    );
  };

  const handleChange = (value: string) => {
    setNationality(value);
  };

  return (
    <>
      <Head>
        <title>{`
        ${__('token_sale_heading_nationality')} - 
        ${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {__('token_sale_heading_nationality')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <fieldset className="flex flex-col gap-12 min-h-[250px]">
            <Select
              label={__('token_sale_label_nationality')}
              value={nationality}
              options={countries || []}
              className="mt-8"
              onChange={handleChange}
              isRequired
            />

            {isRestictedNationality && (
              <ErrorMessage
                error={__('token_sale_restricted_nationality_warning')}
              />
            )}

            <Button
              onClick={handleNext}
              isEnabled={nationality !== '' && !isRestictedNationality}
              className="mt-10"
            >
              {__('token_sale_button_continue')}
            </Button>
          </fieldset>
        </main>
      </div>
    </>
  );
};

export default NationalityPage;
