import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import DonateCheckoutForm from '../../../components/Donate/DonateCheckoutForm';
import { BackButton, Button, ErrorMessage, Heading, Row, Spinner } from '../../../components/ui';
import { DEFAULT_CURRENCY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { readDonationSession, type StoredDonationCard } from '../../../utils/donationSessionStorage';
import { priceFormat } from '../../../utils/helpers';
import { getDonateInitialProps } from '../getDonateInitialProps';

interface DonateCardPageProps {
  generalConfig: GeneralConfig | null;
}

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY as string,
  {
    stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
  },
);

function DonateCardPage({ generalConfig }: DonateCardPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { saleId } = router.query;
  const id = typeof saleId === 'string' ? saleId : '';
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;

  const [session, setSession] = useState<StoredDonationCard | null | 'loading' | 'missing'>('loading');

  useEffect(() => {
    if (!router.isReady || isAuthLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!id) {
      setSession('missing');
      return;
    }
    const stored = readDonationSession(id);
    if (!stored || stored.kind !== 'card') {
      setSession('missing');
      return;
    }
    setSession(stored);
  }, [router, router.isReady, router.asPath, id, isAuthenticated, isAuthLoading]);

  const cardPayload =
    session !== 'loading' && session !== 'missing' && session.kind === 'card' ? session : null;
  const amount = cardPayload?.amount ?? 0;
  const formattedAmount = priceFormat(amount, DEFAULT_CURRENCY);

  const handlePaid = () => {
    if (!cardPayload) return;
    router.push(
      `/donate/success?amount=${amount}&method=card&saleId=${encodeURIComponent(
        cardPayload.result.saleId,
      )}`,
    );
  };

  if (!router.isReady || isAuthLoading || session === 'loading') {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (session === 'missing' || !cardPayload) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-4">
        <Head>
          <title>{`${t('donate_page_title')} - ${platformName}`}</title>
        </Head>
        <ErrorMessage error={t('donate_session_missing')} />
        <Button onClick={() => router.push('/donate')}>{t('donate_change_donation')}</Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t('donate_card_head_title')} - ${platformName}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-6">
        <BackButton
          handleClick={() => router.push(`/donate?amount=${amount}&method=card`)}
        >
          {t('buttons_back')}
        </BackButton>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('donate_step_label', { current: 2, total: 2 })}
        </p>
        <Heading level={1} className="mb-0">
          {t('donate_card_head_title')}
        </Heading>

        <p className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-200">
          {t('donate_payment_summary_title')}
        </p>
        <Row rowKey={t('donate_invoice_amount_label')} value={formattedAmount} />

        <Elements stripe={stripePromise}>
          <DonateCheckoutForm
            clientSecret={cardPayload.result.clientSecret}
            saleId={cardPayload.result.saleId}
            paymentIntentId={cardPayload.result.paymentIntentId}
            userEmail={user?.email}
            onPaid={handlePaid}
          />
        </Elements>
      </div>
    </>
  );
}

DonateCardPage.getInitialProps = async (context: NextPageContext) => getDonateInitialProps(context);

export default DonateCardPage;
