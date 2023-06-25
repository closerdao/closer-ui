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
} from '../../../components/ui';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletState } from '../../../contexts/wallet';
import { useBuyTokens } from '../../../hooks/useBuyTokens';
import { useConfig } from '../../../hooks/useConfig';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

const TokenSaleCheckoutPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { tokens } = router.query;
  const { SOURCE_TOKEN } = useConfig() || {};
  const { buyTokens, getTotalCost, isCeurApproved, approveCeur, isPending } =
    useBuyTokens();
  const [total, setTotal] = useState<number>(0);
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const { isAuthenticated, isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const [web3Error, setWeb3Error] = useState<string | null>(null);

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
      router.push(`/token-sale/sale-open/token-counter?tokens=${tokens}`);
    } else {
      router.push(`/token-sale/sale-open/your-info?tokens=${tokens}`);
    }
  };

  const handleApprovalTx = async () => {
    const { success, error } = await approveCeur(total);
    if (success) {
      setIsApproved(true);
    } else {
      setWeb3Error(parseMessageFromError(error));
    }
  };

  const handlePurchaseTx = async () => {
    const { success, txHash, error } = await buyTokens(tokens as string);
    if (success) {
      router.push(
        `/token-sale/sale-open/success?amountOfTokensPurchased=${tokens}&transactionId=${txHash}`,
      );
    } else {
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
                additionalInfo={__('token_sale_checkout_vat')}
              />
            </div>
          </div>
          {isApproved ? (
            <Button onClick={handlePurchaseTx} isEnabled={!isPending}>
              {isPending
                ? __('token_sale_checkout_button_pending_transaction')
                : __('token_sale_checkout_button_purchase_transaction')}
            </Button>
          ) : (
            <Button onClick={handleApprovalTx} isEnabled={!isPending}>
              {isPending
                ? __('token_sale_checkout_button_pending_transaction')
                : __('token_sale_checkout_button_approve_transaction')}
            </Button>
          )}
          {web3Error && <ErrorMessage error={web3Error} />}
        </main>
      </div>
    </>
  );
};

export default TokenSaleCheckoutPage;
