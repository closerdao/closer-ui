import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect } from 'react';

import { BackButton, Heading, ProgressBar } from '../../components/ui';

import { event as gaEvent } from 'nextjs-google-analytics';

import PageNotFound from '../404';
import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const TokenSaleSuccessPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { amountOfTokensPurchased, transactionId } = router.query;
  const { isAuthenticated, isLoading } = useAuth();
  const { isWalletReady } = useContext(WalletState);

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
  }, []);

  const goBack = async () => {
    router.push('/token');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true' || !isWalletReady) {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${__('token_sale_heading_checkout')} - 
        ${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🎊 {__('token_sale_heading_success')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-12">
          <div className="">
            <Heading level={3} hasBorder={false}>
              {__('token_sale_success_message')}
            </Heading>
          </div>

          <div className='w-full h-[240px] bg-[url("/images/token-sale/token-success-artwork.jpg")] bg-no-repeat bg-center'>
            <Heading
              level={2}
              className="text-accent text-center"
            >{`${amountOfTokensPurchased} ${__(
              'token_sale_token_symbol',
            )}`}</Heading>
          </div>
          <Heading level={4} className="uppercase">
            {`${__('token_sale_success_purchase_number')}`}
            <p className="break-words">{transactionId}</p>
          </Heading>
        </main>
      </div>
    </>
  );
};

export default TokenSaleSuccessPage;
