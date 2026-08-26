import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { BackButton, Button, ErrorMessage, Heading, Spinner } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { DEFAULT_CURRENCY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { useConfig } from '../../../hooks/useConfig';
import type { AccountingEntitiesConfig } from '../../../types/api';
import type { CreateDonationBankResult } from '../../../types/donation';
import { resolveAccountingEntityForProduct } from '../../../utils/accountingEntityResolve';
import { pollDonationSaleUntilPaid } from '../../../utils/donation.helpers';
import { readDonationSession, type StoredDonationBank } from '../../../utils/donationSessionStorage';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { priceFormat } from '../../../utils/helpers';
import {
  tokenSaleStatusBadgeVariant,
  tokenSaleStatusLabelKey,
} from '../../../utils/orderStatusBadge';
import { formatVatRatePercent, normalizeVatRate } from '../../../utils/stayVat';

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
}

function DonateBankPage() {
  const t = useTranslations();
  const router = useRouter();
  const { saleId } = router.query;
  const id = typeof saleId === 'string' ? saleId : '';
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general');
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

  // Bank details come from the sale-init result, falling back to the
  // accounting entity assigned to donations — never hardcoded values.
  const accountingConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;
  const donationsEntity = accountingConfig?.enabled
    ? resolveAccountingEntityForProduct('donations', accountingConfig.elements)
    : null;

  const bankBeneficiaryDisplay =
    bankBlock?.beneficiary?.trim() || donationsEntity?.legalName?.trim() || '';
  const bankIbanDisplay =
    bankBlock?.closerIban?.trim() || donationsEntity?.iban?.trim() || '';
  const bankAddressDisplay =
    bankBlock?.beneficiaryAddress?.trim() ||
    donationsEntity?.address?.trim() ||
    '';
  const bankBicDisplay =
    bankBlock?.beneficiaryBic?.trim() || donationsEntity?.bic?.trim() || '';

  const teamEmail = (generalConfig?.teamEmail || defaultConfig?.teamEmail || '').trim();

  // VAT included in the (VAT-inclusive) total, at the donations rate from
  // the accounting-entities config, falling back to the payment default rate.
  const paymentConfig = getCachedConfig('payment') as { vatRate?: number } | null;
  const vatRate =
    (accountingConfig?.enabled
      ? normalizeVatRate(accountingConfig.vatByProductType?.donations)
      : null) ??
    normalizeVatRate(paymentConfig?.vatRate) ??
    0;
  const taxIncluded =
    Math.round(((amount * vatRate) / (1 + vatRate)) * 100) / 100;

  useEffect(() => {
    if (!bankBlock?.saleId || session === 'loading' || session === 'missing') return;
    const sid = bankBlock.saleId;
    const ac = new AbortController();
    const { signal } = ac;
    let mounted = true;
    (async () => {
      const paid = await pollDonationSaleUntilPaid(
        sid,
        (status) => {
          if (!mounted || signal.aborted || !status) return;
          setBankPollStatus(status);
        },
        { signal },
      );
      if (mounted && !signal.aborted && paid) {
        router.push(`/sale/${encodeURIComponent(sid)}`);
      }
    })();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [bankBlock?.saleId, session, amount, router]);

  const handleMarkSent = () => {
    if (!bankBlock) return;
    router.push(`/sale/${encodeURIComponent(bankBlock.saleId)}`);
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

  const memoCode =
    bankBlock.memoCode?.trim() ||
    (bankBlock as { confirmation_code?: string }).confirmation_code?.trim() ||
    '';

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

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-950">
            {t('donate_bank_memo_block', { reference: memoCode })}
          </p>
        </div>

        {bankPollStatus && (
          <div className="flex items-center gap-2" role="status">
            <span className="text-sm text-gray-600">
              {t('sale_summary_status')}
            </span>
            <Badge variant={tokenSaleStatusBadgeVariant(bankPollStatus)}>
              {t(tokenSaleStatusLabelKey(bankPollStatus))}
            </Badge>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('donate_bank_details_heading')}
          </p>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {bankBeneficiaryDisplay && (
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
            )}
            {bankAddressDisplay && (
              <div className="px-4 py-3 flex flex-col gap-1 bg-white">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('donate_bank_beneficiary_address')}
                </span>
                <span className="text-sm text-gray-900 whitespace-pre-line">{bankAddressDisplay}</span>
              </div>
            )}
            {bankIbanDisplay && (
              <div className="px-4 py-3 flex flex-col gap-1 bg-white">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('oasa_iban')}
                </span>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-mono text-gray-900 break-all">{bankIbanDisplay}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(bankIbanDisplay)}
                    className="text-xs text-accent font-medium shrink-0"
                  >
                    {t('donate_copy')}
                  </button>
                </div>
              </div>
            )}
            {bankBicDisplay && (
              <div className="px-4 py-3 flex flex-col gap-1 bg-white">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t('oasa_bic')}
                </span>
                <span className="text-sm font-mono text-gray-900">{bankBicDisplay}</span>
              </div>
            )}
            <div className="px-4 py-3 flex flex-col gap-1 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('donate_reference_label')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-mono text-gray-900">{memoCode}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(memoCode)}
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
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-base font-semibold text-gray-900">{formattedAmount}</span>
                <span className="text-xs italic text-gray-600">
                  {t('stay_create_line_tax_included')} (
                  {formatVatRatePercent(vatRate)}%):{' '}
                  {priceFormat(taxIncluded, DEFAULT_CURRENCY)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500 leading-relaxed">{t('donate_bank_eur_only')}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{t('donate_bank_pending_note')}</p>
          {teamEmail && (
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('donate_bank_followup', { email: teamEmail })}
            </p>
          )}
        </div>

        <Button onClick={handleMarkSent}>{t('donate_bank_mark_sent')}</Button>
      </div>
    </>
  );
}

export default DonateBankPage;
