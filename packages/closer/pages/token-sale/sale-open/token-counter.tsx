import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import TokenBuyWidget from '../../../components/TokenBuyWidget';
import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
} from '../../../components/ui';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { __ } from '../../../utils/helpers';

const TokenCounterPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { nationality, tokens } = router.query;
  const { isAuthenticated, isLoading, user } = useAuth();

  const [tokensToBuy, setTokensToBuy] = useState(tokens ? Number(tokens) : 10);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (tokens) {
      setTokensToBuy(Number(tokens));
    }
  }, [tokens]);

  const goBack = async () => {
    if (user && user.kycPassed) {
      router.push('/token-sale/sale-open');
    } else {
      router.push('/token-sale/sale-open/nationality');
    }
  };

  const handleNext = async () => {
    if (user && user.kycPassed) {
      router.push(`/token-sale/sale-open/checkout?tokens=${tokensToBuy}`);
    } else {
      router.push(
        `/token-sale/sale-open/your-info?nationality=${nationality}&tokens=${tokensToBuy}`,
      );
    }
  };

  return (
    <>
      <Head>
        <title>{`
        ${__('token_sale_heading_token_counter')} - 
        ${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {__('token_sale_heading_token_counter')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <fieldset className="flex flex-col gap-12 min-h-[250px]">
            <TokenBuyWidget
              tokensToBuy={tokensToBuy}
              setTokensToBuy={setTokensToBuy}
            />
          </fieldset>
          <Button
            onClick={handleNext}
            isEnabled={Boolean(tokensToBuy)}
            className="mt-10"
          >
            {__('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

export default TokenCounterPage;
