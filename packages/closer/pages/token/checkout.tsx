import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import {
  BackButton,
  Button,
  ErrorMessage,
  Heading,
  ProgressBar,
  Row,
  Spinner,
} from '../../components/ui';

import PageNotFound from '../404';
import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

const TokenSaleCheckoutPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { tokens } = router.query || { tokens: '33' };

  const { SOURCE_TOKEN } = useConfig() || {};
  const { buyTokens, getTotalCost, isCeurApproved, approveCeur, isPending } =
    useBuyTokens();
  const [total, setTotal] = useState<number>(0);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const { isAuthenticated, isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const [apiError, setApiError] = useState(null);

  const [isMetamaskLoading, setIsMetamaskLoading] = useState(false);

  const unitPrice = (total / parseInt(tokens as string)).toFixed(2);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    isWalletReady &&
      (async () => {
        const totalCost = await getTotalCost(tokens as string);
        setTotal(totalCost);
        const isAllowanceSufficient = await isCeurApproved(tokens as string);
        setIsApproved(isAllowanceSufficient);
      })();
  }, [isWalletReady]);

  const goBack = async () => {
    if (user && user.kycPassed) {
      router.push(`/token/token-counter?tokens=${tokens}`);
    } else {
      router.push(`/token/your-info?tokens=${tokens}`);
    }
  };

  const handleApprovalTx = async () => {
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);
    const { success, error } = await approveCeur(total);
    if (success) {
      setIsApproved(true);
    } else {
      setWeb3Error(parseMessageFromError(error));
    }
    setIsMetamaskLoading(false);
  };

  const handlePurchaseTx = async () => {
    setWeb3Error(null);
    setApiError(null);
    setIsMetamaskLoading(true);
    const { success, txHash, error } = await buyTokens(tokens as string);
    if (success) {
      try {
        await api.post('/metric', {
          event: 'token-sale',
          value: Number(tokens),
          category: 'revenue',
        });
      } catch (error: unknown) {
        setApiError(parseMessageFromError(error));
      } finally {
        setIsMetamaskLoading(false);
      }
      router.push(
        `/token/success?amountOfTokensPurchased=${tokens}&transactionId=${txHash}`,
      );
    } else {
      setWeb3Error(parseMessageFromError(error));
      setIsMetamaskLoading(false);
    }
  };

  const handleEditAmount = () => {
    router.push(`/token/token-counter?tokens=${tokens}`);
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
                )} = ${unitPrice} ${SOURCE_TOKEN}`}
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
                value={`${__('token_sale_source_token')} ${total} `}
                additionalInfo={__('token_sale_ceur_disclaimer')}
              />
            </div>
          </div>
          {isApproved ? (
            <Button
              onClick={handlePurchaseTx}
              isEnabled={!isPending && !isMetamaskLoading}
            >
              {isPending || isMetamaskLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  {__('token_sale_checkout_button_pending_transaction')}
                </div>
              ) : (
                __('token_sale_checkout_button_purchase_transaction')
              )}
            </Button>
          ) : (
            <Button
              onClick={handleApprovalTx}
              isEnabled={!isPending && !isMetamaskLoading}
            >
              {isPending || isMetamaskLoading ? (
                <div className="flex gap-2 items-center">
                  <Spinner />
                  {__('token_sale_checkout_button_pending_transaction')}
                </div>
              ) : (
                __('token_sale_checkout_button_approve_transaction')
              )}
            </Button>
          )}
          <p className="text-center">
            {!isApproved && !isPending && __('token_sale_approve_text')}

            {!isApproved && isPending && __('token_sale_approve_pending_text')}

            {isApproved && !isPending && __('token_sale_buy_text')}

            {isApproved && isPending && __('token_sale_buy_pending_text')}
          </p>
          {web3Error && <ErrorMessage error={web3Error} />}
          {apiError && <ErrorMessage error={apiError} />}
        </main>
      </div>
    </>
  );
};

export default TokenSaleCheckoutPage;