import Head from 'next/head';
import { useRouter } from 'next/router';

import {
  BackButton,
  Button,
  Heading,
  ProgressBar,
  Row,
} from '../../../components/ui';

import { TOKEN_SALE_STEPS } from '../../../constants';
import { useConfig } from '../../../hooks/useConfig';
import { __ } from '../../../utils/helpers';

const TokenSaleCheckoutPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();
  const { tokens } = router.query;
  const { SOURCE_TOKEN, TOKEN_PRICE } = useConfig() || {};

  const goBack = async () => {
    router.push(`/token-sale/sale-open/your-info?tokens=${tokens}`);
  };

  const handleSignTransaction = async () => {
    console.log('sign transaction');
  };

  const handleEditAmount = () => {
    console.log('edit amount');
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

      <div className="w-full max-w-screen-sm mx-auto p-8">
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
                )} = ${TOKEN_PRICE} ${SOURCE_TOKEN}`}
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
                  Number(TOKEN_PRICE) * Number(tokens)
                } `}
                additionalInfo={__('token_sale_checkout_vat')}
              />
              <Row
                rowKey={__('token_sale_checkout_your_balance')}
                value={'How can we get CEUR balance from wallet?'}
                additionalInfo={__('token_sale_checkout_vat')}
              />
            </div>
          </div>
          <Button onClick={handleSignTransaction}>
            {__('token_sale_checkout_button_sign_transaction')}
          </Button>
        </main>
      </div>
    </>
  );
};

export default TokenSaleCheckoutPage;
