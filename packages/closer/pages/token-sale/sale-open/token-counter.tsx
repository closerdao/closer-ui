import Head from 'next/head';
import { useRouter } from 'next/router';

import TokenBuyWidget from '../../../components/TokenBuyWidget';
import { BackButton, Button, Heading, ProgressBar } from '../../../components/ui';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useConfig } from '../../../hooks/useConfig';
import { __ } from '../../../utils/helpers';
import { useEffect, useState } from 'react';

const TokenCounterPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { nationality, tokens } = router.query;

  console.log('tokens=', tokens);

  const [tokensToBuy, setTokensToBuy] = useState(tokens ? Number(tokens) : 10);

  useEffect(() => {
    if (tokens) {
      setTokensToBuy(Number(tokens));
    }
  }, [tokens]);

  



  const goBack = async () => {
    router.push('/token-sale/sale-open/nationality');
  };

  const handleNext = async () => {
    router.push(`/token-sale/sale-open/your-info?nationality=${nationality}&tokens=${tokensToBuy}`);
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

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🧮 {__('token_sale_heading_token_counter')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24">
          <fieldset className="flex flex-col gap-12 min-h-[250px]">
            <TokenBuyWidget tokensToBuy={tokensToBuy} setTokensToBuy={setTokensToBuy} />
          </fieldset>
          <Button
              onClick={handleNext}
              isEnabled={nationality !== ''}
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
