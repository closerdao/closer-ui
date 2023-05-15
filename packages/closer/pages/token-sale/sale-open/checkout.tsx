import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
  Row,
} from '../../../components/ui';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useBuyTokens } from '../../../hooks/useBuyTokens';
import { useConfig } from '../../../hooks/useConfig';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

const TokenSaleCheckoutPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const { buyTokens } = useBuyTokens();
  const router = useRouter();
  const { tokens } = router.query;
  const { SOURCE_TOKEN } = useConfig() || {};
  const { getTokenPrice } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number>(0);
  const { isAuthenticated, isLoading, user } = useAuth();

  const [web3Error, setWeb3Error] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    (async () => {
      const getPrice = await getTokenPrice();
      setTokenPrice(getPrice.price);
    })();
  }, []);

  const goBack = async () => {
    if (user && user.kycPassed) {
      router.push(`/token-sale/sale-open/token-counter?tokens=${tokens}`);
    } else {
      router.push(`/token-sale/sale-open/your-info?tokens=${tokens}`);
    }
  };

  const handleSignTransaction = async () => {
    setWeb3Error(null);
    try {
      const {
        status,
        transactionId,
        amountOfTokensPurchased,
        error,
      }: {
        status: string;
        transactionId: string | null;
        amountOfTokensPurchased: number | null;
        error: string | null;
      } = await buyTokens(Number(tokens));

      if (status === 'success') {
        router.push(
          `/token-sale/sale-open/success?amountOfTokensPurchased=${amountOfTokensPurchased}&transactionId=${transactionId}`,
        );
      }
      if (error) {
        setWeb3Error(error);
      }
    } catch (error) {
      setWeb3Error(parseMessageFromError(error));
    }
  };

  const handleEditAmount = () => {
    router.push(`/token-sale/sale-open/token-counter?tokens=${tokens}`);
  };

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
          💰 {__('token_sale_heading_checkout')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-12">
          <div className="">
            <Heading level={3} hasBorder={true}>
              🏡 {__('token_sale_checkout_your_purchse')}
            </Heading>
            <div className="mb-10">
              <Row
                rowKey={__('token_sale_token_symbol')}
                value={tokens?.toString()}
                additionalInfo={`1 ${__(
                  'token_sale_token_symbol',
                )} = ${tokenPrice} ${SOURCE_TOKEN}`}
              />
            </div>
            <Button
              className="mt-3"
              type="secondary"
              onClick={handleEditAmount}
            >
              {__('subscriptions_summary_edit_button')}
            </Button>
          </div>

          <div className="">
            <Heading level={3} hasBorder={true}>
              ➕ {__('token_sale_checkout_total')}
            </Heading>
            <div className="flex flex-col gap-6">
              <Row
                rowKey={__('token_sale_checkout_total')}
                value={`${__('token_sale_source_token')} ${
                  Number(tokenPrice) * Number(tokens)
                } `}
                additionalInfo={__('token_sale_checkout_vat')}
              />
          
            </div>
          </div>
          <Button onClick={handleSignTransaction}>
            {__('token_sale_checkout_button_sign_transaction')}
          </Button>
          {web3Error && <ErrorMessage error={web3Error} />}
        </main>
      </div>
    </>
  );
};

export default TokenSaleCheckoutPage;
