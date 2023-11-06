import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext, useEffect } from 'react';

import Wallet from '../../components/Wallet';
import {
  BackButton,
  Button,
  Card,
  Heading,
  ProgressBar,
} from '../../components/ui';

import PageNotFound from '../404';
import { TOKEN_SALE_STEPS } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { WalletState } from '../../contexts/wallet';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const TokenSaleBeforeYouBeginPage = () => {
  const { PLATFORM_NAME } = useConfig() || {};
  const router = useRouter();

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const { isAuthenticated, isLoading, user } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading]);

  const handleNext = async () => {
    if (user && user.kycPassed === true) {
      router.push('/token/token-counter');
    } else {
      router.push('/token/nationality');
    }
  };

  const goBack = async () => {
    router.push('/token');
  };

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  return (
    <>
      <Head>
        <title>{`
        ${__('token_sale_heading_before_you_begin')} - 
        ${__(
          'token_sale_public_sale_announcement',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4">
        <BackButton handleClick={goBack}>{__('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          🏡 {__('token_sale_heading_before_you_begin')}
        </Heading>

        <ProgressBar steps={TOKEN_SALE_STEPS} />

        <main className="pt-14 pb-24 flex flex-col gap-4">
          <p>{__('token_sale_before_you_begin_text_1')}</p>
          <p>{__('token_sale_before_you_begin_text_2')}</p>
          <p>{__('token_sale_before_you_begin_text_3')}</p>
          <div>
            <Heading level={3} hasBorder={true}>
              💰 {__('token_sale_before_you_begin_checklist_heading')}
            </Heading>
            <ul>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('token_sale_before_you_begin_checklist_1')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('token_sale_before_you_begin_checklist_2')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('token_sale_before_you_begin_checklist_3')}
              </li>
              <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                {__('token_sale_before_you_begin_checklist_4')}
              </li>
            </ul>
          </div>

          <div>
            <Heading level={3} hasBorder={true}>
              💰 {__('token_sale_before_you_begin_need_help_heading')}
            </Heading>
            <ul>
              <li className="mb-1.5">
                <Card className="mb-4">
                  <Link
                    className="text-accent font-bold underline"
                    href={__('token_sale_complete_guide_link')}
                  >
                    📄 {__('token_sale_complete_guide')}
                  </Link>
                </Card>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={__('token_sale_before_you_begin_guide_1_link')}
                >
                  {__('token_sale_before_you_begin_guide_1')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={__('token_sale_before_you_begin_guide_2_link')}
                >
                  {__('token_sale_before_you_begin_guide_2')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={__('token_sale_before_you_begin_guide_3_link')}
                >
                  {__('token_sale_before_you_begin_guide_3')}
                </Link>
              </li>
              <li className="mb-1.5">
                <Link
                  className="text-accent font-bold underline"
                  href={__('token_sale_before_you_begin_guide_link_contact')}
                >
                  {__('token_sale_before_you_begin_guide_4')}
                </Link>
              </li>
            </ul>
          </div>

          {isWalletEnabled && (
            <div className="my-8">
              <Wallet />
            </div>
          )}

          <Button onClick={handleNext} isEnabled={isWalletReady}>
            {__('token_sale_button_continue')}
          </Button>
        </main>
      </div>
    </>
  );
};

export default TokenSaleBeforeYouBeginPage;
