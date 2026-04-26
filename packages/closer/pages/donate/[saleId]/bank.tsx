import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { BackButton, Button, ErrorMessage, Heading, Spinner } from '../../../components/ui';
import { DEFAULT_CURRENCY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import type { CreateDonationBankResult } from '../../../types/donation';
import { GeneralConfig } from '../../../types';
import { pollDonationSaleUntilPaid } from '../../../utils/donation.helpers';
import { readDonationSession, type StoredDonationBank } from '../../../utils/donationSessionStorage';
import { priceFormat } from '../../../utils/helpers';
import { getDonateInitialProps } from '../getDonateInitialProps';

interface DonateBankPageProps {
  generalConfig: GeneralConfig | null;
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
}

function DonateBankPage({ generalConfig }: DonateBankPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { saleId } = router.query;
  const id = typeof saleId === 'string' ? saleId : '';
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;

  const [session, setSession] = useState<StoredDonationBank | null | 'loading' | 'missing'>('loading');
  const [bankPollStatus, setBankPollStatus] = useState<string | null>(null);

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
    if (!stored || stored.kind !== 'bank') {
      setSession('missing');
      return;
    }
    setSession(stored);
  }, [router, router.isReady, router.asPath, id, isAuthenticated, isAuthLoading]);

  const bankPayload =
    session && typeof session === 'object' && session.kind === 'bank' ? session : null;
  const bankBlock: CreateDonationBankResult | null = bankPayload?.result ?? null;
  const amount = bankPayload?.amount ?? 0;
  const formattedAmount = priceFormat(amount, DEFAULT_CURRENCY);

  const bankBeneficiaryDisplay =
    bankBlock?.beneficiary?.trim() || t('oasa_beneficiary_name');
  const bankAddressDisplay =
    bankBlock?.beneficiaryAddress?.trim() || t('oasa_address_value');
  const bankBicDisplay = bankBlock?.beneficiaryBic?.trim() || t('oasa_bic_value');

  useEffect(() => {
    if (!bankBlock?.saleId || session === 'loading' || session === 'missing') return;
    const sid = bankBlock.saleId;
    let cancelled = false;
    (async () => {
      const paid = await pollDonationSaleUntilPaid(sid, (status) => {
        if (!cancelled && status) setBankPollStatus(status);
      });
      if (!cancelled && paid) {
        router.push(
          `/donate/success?amount=${amount}&method=bank&saleId=${encodeURIComponent(sid)}`,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bankBlock?.saleId, session, amount, router]);

  const handleMarkSent = () => {
    if (!bankBlock) return;
    router.push(
      `/donate/success?amount=${amount}&method=bank&saleId=${encodeURIComponent(bankBlock.saleId)}`,
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

  if (session === 'missing' || !bankBlock) {
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
        <title>{`${t('donate_bank_head_title')} - ${platformName}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-6">
        <BackButton
          handleClick={() =>
            router.push(`/donate?amount=${amount}&method=bank`)
          }
        >
          {t('buttons_back')}
        </BackButton>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('donate_step_label', { current: 2, total: 2 })}
        </p>
        <Heading level={1} className="mb-0">
          {t('donate_bank_head_title')}
        </Heading>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('donate_bank_intro', { amount: formattedAmount })}
        </p>
        <p className="text-xs text-gray-500">{t('donate_bank_eur_only')}</p>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-950">
            {t('donate_bank_memo_block', { reference: bankBlock.confirmation_code })}
          </p>
        </div>

        {bankPollStatus && (
          <p className="text-sm text-gray-600" role="status">
            {t('donate_poll_status', { status: bankPollStatus })}
          </p>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('donate_bank_details_heading')}
          </p>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('oasa_beneficiary')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-gray-900">{bankBeneficiaryDisplay}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankBeneficiaryDisplay)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  {t('donate_copy')}
                </button>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('oasa_iban')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-mono text-gray-900 break-all">{bankBlock.closerIban}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankBlock.closerIban)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  {t('donate_copy')}
                </button>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('oasa_bic')}
              </span>
              <span className="text-sm font-mono text-gray-900">{bankBicDisplay}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('oasa_address')}
              </span>
              <span className="text-sm text-gray-900 whitespace-pre-line">{bankAddressDisplay}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('donate_reference_label')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-mono text-gray-900">{bankBlock.confirmation_code}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankBlock.confirmation_code)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  {t('donate_copy')}
                </button>
              </div>
            </div>
            <div className="px-4 py-3 flex flex-col gap-1 bg-gray-50">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('donate_invoice_amount_label')}
              </span>
              <span className="text-base font-semibold text-gray-900">{formattedAmount}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">{t('donate_bank_pending_note')}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{t('donate_bank_followup')}</p>

        <Button onClick={handleMarkSent}>{t('donate_bank_mark_sent')}</Button>
      </div>
    </>
  );
}

DonateBankPage.getInitialProps = async (context: NextPageContext) => getDonateInitialProps(context);

export default DonateBankPage;
