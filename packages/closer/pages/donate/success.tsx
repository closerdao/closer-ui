import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import ConfirmationCelebrationOverlay from '../../components/ConfirmationCelebrationOverlay';
import { Button, Heading } from '../../components/ui';
import { DEFAULT_CURRENCY } from '../../constants';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { priceFormat } from '../../utils/helpers';
import { loadLocaleData } from '../../utils/locale.helpers';

interface DonateSuccessPageProps {
  generalConfig: GeneralConfig | null;
}

const CELEBRATION_DURATION_MS = 2800;

function DonateSuccessPage({ generalConfig }: DonateSuccessPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowCelebration(false), CELEBRATION_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;

  const amount = useMemo(() => {
    const raw = Number(router.query.amount);
    if (!Number.isFinite(raw) || raw < 1) return null;
    return Math.min(Math.floor(raw), 999999);
  }, [router.query.amount]);

  const methodParam = String(router.query.method || 'bank');
  const method =
    methodParam === 'card' ? 'card' : methodParam === 'crypto' ? 'crypto' : 'bank';
  const formattedAmount =
    amount !== null ? priceFormat(amount, DEFAULT_CURRENCY) : '';

  const lead =
    amount === null
      ? t('donate_success_generic_lead')
      : method === 'card'
        ? t('donate_success_card_lead', { amount: formattedAmount })
        : method === 'crypto'
          ? t('donate_success_crypto_lead', { amount: formattedAmount })
          : t('donate_success_bank_lead', { amount: formattedAmount });

  return (
    <>
      <Head>
        <title>{`${t('donate_success_title')} - ${platformName}`}</title>
      </Head>

      <ConfirmationCelebrationOverlay
        show={showCelebration}
        title={t('donate_success_celebration_title')}
      />

      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-6">
        <Heading level={1} className="text-center">
          {t('donate_success_title')}
        </Heading>
        <p className="text-center text-gray-700 leading-relaxed">{lead}</p>
        <Button onClick={() => router.push('/fundraiser')}>{t('donate_success_cta')}</Button>
      </div>
    </>
  );
}

DonateSuccessPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;

    return {
      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default DonateSuccessPage;
