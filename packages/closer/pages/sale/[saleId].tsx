import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { Info } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import ConfirmationCelebrationOverlay, {
  CONFIRMATION_CELEBRATION_DURATION_MS,
} from '../../components/ConfirmationCelebrationOverlay';
import Wallet from '../../components/Wallet';
import { Badge } from '../../components/ui/badge';
import { Button, Card, ErrorMessage, Heading, Spinner } from '../../components/ui';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import {
  AccountingEntitiesConfig,
  TokenSale,
} from '../../types/api';
import { resolveAccountingEntityFromSale } from '../../utils/accountingEntityResolve';
import api, { formatSearch } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  formatIsoFiatAmount,
  isIso4217Currency,
} from '../../utils/currencyFormat';
import {
  tokenSaleStatusBadgeVariant,
  tokenSaleStatusLabelKey,
} from '../../utils/orderStatusBadge';
import { getTransactionExplorerUrl } from '../../utils/transactionExplorerUrl';
import { loadLocaleData } from '../../utils/locale.helpers';
import { TOKEN_PURCHASE_TERMS_DOC_URL } from '../../constants';
import PageNotFound from '../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
  accountingEntitiesConfig: AccountingEntitiesConfig | null;
}

const SaleSummaryPage = ({
  generalConfig,
  accountingEntitiesConfig,
}: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;
  const router = useRouter();
  const { saleId } = router.query;
  const id = typeof saleId === 'string' ? saleId : '';
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [isLoadingSale, setIsLoadingSale] = useState(true);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [sale, setSale] = useState<TokenSale | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!router.isReady || isAuthLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!id) {
      setSaleError(t('sale_summary_invalid_id'));
      setIsLoadingSale(false);
      return;
    }

    const fetchSale = async () => {
      setIsLoadingSale(true);
      setSaleError(null);
      try {
        const res = await api.get(
          '/sale',
          {
            params: {
              where: formatSearch({ _id: id }),
              limit: 1,
            },
            cache: false,
          } as Parameters<typeof api.get>[1],
        );
        const rows = res?.data?.results;
        const list = Array.isArray(rows) ? rows : [];
        const first = (list[0] || null) as TokenSale | null;
        if (!first) {
          setSaleError(t('sale_summary_not_found'));
          return;
        }
        setSale(first);
      } catch (error: unknown) {
        setSaleError(parseMessageFromError(error));
      } finally {
        setIsLoadingSale(false);
      }
    };

    fetchSale();
  }, [router, router.isReady, router.asPath, id, isAuthenticated, isAuthLoading, t]);

  const isFiatBankReminderUrl = useMemo(() => {
    if (!router.isReady) return false;
    return (
      router.query.tokenSaleType === 'fiat' &&
      typeof router.query.memoCode === 'string' &&
      router.query.memoCode.trim().length > 0
    );
  }, [router.isReady, router.query.tokenSaleType, router.query.memoCode]);

  const memoFromBankReminderUrl =
    typeof router.query.memoCode === 'string'
      ? router.query.memoCode
      : '';

  const bankReminderMemo = useMemo(() => {
    const fromSale = sale?.memoCode?.trim() ?? '';
    return fromSale || memoFromBankReminderUrl.trim();
  }, [sale?.memoCode, memoFromBankReminderUrl]);

  const showBankTransferReminder = useMemo(() => {
    if (!sale || !bankReminderMemo || sale.status !== 'pending-payment') {
      return false;
    }
    return (
      sale.paymentMethod === 'bank' ||
      (sale.product_type === 'token' && isFiatBankReminderUrl)
    );
  }, [sale, bankReminderMemo, isFiatBankReminderUrl]);

  const showCelebrationShell = useMemo(() => {
    if (!sale || saleError) return false;
    if (sale.status === 'paid') return true;
    if (sale.status !== 'pending-payment' || !bankReminderMemo) return false;
    return (
      sale.paymentMethod === 'bank' ||
      (sale.product_type === 'token' && isFiatBankReminderUrl)
    );
  }, [sale, saleError, bankReminderMemo, isFiatBankReminderUrl]);

  useEffect(() => {
    if (!sale || !router.isReady || !showCelebrationShell) return;
    setShowCelebration(true);
    const timer = window.setTimeout(
      () => setShowCelebration(false),
      CONFIRMATION_CELEBRATION_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [sale, router.isReady, showCelebrationShell]);

  useEffect(() => {
    if (!sale?._id || sale.product_type !== 'token') return;
    gaEvent('token_success', {
      category: 'sales',
      label: 'token',
    });
    const qty = sale.quantity;
    if (typeof qty === 'number' && Number.isFinite(qty) && qty > 0) {
      api.post('/metric', {
        event: 'token-sale-success',
        value: 'token-sale',
        point: qty,
        category: 'engagement',
      });
    }
  }, [sale?._id, sale?.product_type]);

  const createdAt = useMemo(() => {
    if (!sale?.created) return '-';
    const d = new Date(sale.created);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  }, [sale?.created]);

  const issuerEntity = useMemo(
    () =>
      resolveAccountingEntityFromSale(
        sale?.entity,
        accountingEntitiesConfig?.elements,
      ),
    [sale?.entity, accountingEntitiesConfig?.elements],
  );

  const showIssuerBlock =
    issuerEntity &&
    Boolean(
      issuerEntity.legalName?.trim() ||
        issuerEntity.taxNumber?.trim() ||
        issuerEntity.address?.trim() ||
        issuerEntity.accountingDescription?.trim(),
    );

  const showIssuerBlockInInvoice =
    Boolean(showIssuerBlock) &&
    !(showBankTransferReminder && bankReminderMemo);

  const invoiceCurrency = useMemo(() => {
    const raw = sale?.currency?.trim();
    if (!raw) return 'EUR';
    const upper = raw.toUpperCase();
    return isIso4217Currency(upper) ? upper : 'EUR';
  }, [sale?.currency]);

  const formattedTotalPrice = useMemo(() => {
    if (sale == null) return '';
    return formatIsoFiatAmount(
      Number(sale.total_price),
      invoiceCurrency,
      router.locale || undefined,
      { min: 2, max: 2 },
    );
  }, [sale, invoiceCurrency, router.locale]);

  const bankInstructionsFormattedAmount = useMemo(() => {
    if (sale == null) return '';
    const amountFromSaleRecord =
      sale.status === 'pending-payment' &&
      sale.paymentMethod === 'bank' &&
      Boolean(sale.memoCode?.trim());
    if (amountFromSaleRecord) {
      return formatIsoFiatAmount(
        Number(sale.total_price),
        invoiceCurrency,
        router.locale || undefined,
        { min: 2, max: 2 },
      );
    }
    const raw =
      typeof router.query.totalFiat === 'string' ? router.query.totalFiat : '';
    if (raw.trim()) {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        return formatIsoFiatAmount(n, invoiceCurrency, router.locale || undefined, {
          min: 2,
          max: 2,
        });
      }
      return `€${raw}`;
    }
    return formattedTotalPrice;
  }, [
    sale,
    invoiceCurrency,
    formattedTotalPrice,
    router.locale,
    router.query.totalFiat,
  ]);

  const ibanLastFourFromQuery = useMemo(() => {
    const iban =
      typeof router.query.ibanNumber === 'string'
        ? router.query.ibanNumber.replace(/\s/g, '')
        : '';
    return iban.length >= 4 ? iban.slice(-4) : iban;
  }, [router.query.ibanNumber]);

  const payerIbanLastFour = useMemo(() => {
    const fromMeta = sale?.meta?.normalizedSenderIban;
    if (typeof fromMeta === 'string') {
      const clean = fromMeta.replace(/\s/g, '');
      if (clean.length >= 4) return clean.slice(-4);
    }
    return ibanLastFourFromQuery;
  }, [sale?.meta, ibanLastFourFromQuery]);

  const saleSummaryLead = useMemo(() => {
    if (!sale) return { text: '', tone: null as 'paid' | 'pending' | 'neutral' | null };
    if (sale.status === 'paid') {
      return { text: t('sale_summary_festive_lead'), tone: 'paid' as const };
    }
    if (sale.status === 'pending-payment') {
      return {
        text: t('sale_summary_pending_payment_lead'),
        tone: 'pending' as const,
      };
    }
    return { text: t('sale_summary_receipt_neutral_lead'), tone: 'neutral' as const };
  }, [sale, t]);

  const celebrationOverlayHeading =
    sale?.status === 'paid'
      ? t('sale_summary_success_heading')
      : t('token_sale_bank_transfer_success_bank_transfer');

  const bankBeneficiaryDisplay =
    issuerEntity?.legalName?.trim() || t('oasa_beneficiary_name');
  const bankIbanDisplay =
    issuerEntity?.iban?.trim() ||
    process.env.NEXT_PUBLIC_CLOSER_IBAN ||
    t('oasa_iban_value');
  const bankBicDisplay =
    issuerEntity?.bic?.trim() || t('oasa_bic_value');
  const bankAddressDisplay =
    issuerEntity?.address?.trim() || t('oasa_address_value');

  if (process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE !== 'true') {
    return <PageNotFound />;
  }

  if (!router.isReady || isAuthLoading || isLoadingSale) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`${t('sale_summary_title')} - ${platformName}`}</title>
      </Head>

      {sale && !saleError && showCelebrationShell && (
        <ConfirmationCelebrationOverlay
          show={showCelebration}
          title={celebrationOverlayHeading}
        />
      )}

      <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex flex-col gap-6">
        {sale && (
          <>
            <Heading level={1}>{t('sale_summary_title')}</Heading>
            {!showBankTransferReminder ? (
              <p
                className={`rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed ${
                  saleSummaryLead.tone === 'paid'
                    ? 'border-accent/30 bg-accent-light text-gray-900'
                    : saleSummaryLead.tone === 'pending'
                      ? 'border-amber-200 bg-amber-50 text-gray-900'
                      : 'border-gray-200 bg-gray-50 text-gray-900'
                }`}
              >
                {saleSummaryLead.text}
              </p>
            ) : null}
            {showBankTransferReminder && bankReminderMemo ? (
              <Card className="p-4 flex flex-col gap-5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t('sale_summary_bank_transfer_compact_intro')}
                </p>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">
                    {t('sale_summary_bank_transfer_reference_label')}
                  </p>
                  <p className="text-xl font-mono font-semibold text-gray-900 mt-1 tracking-wide">
                    {bankReminderMemo}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                  <span className="card-feature">{t('sale_summary_total')}</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {bankInstructionsFormattedAmount}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_beneficiary')}</span>
                    <span className="text-sm text-gray-900">{bankBeneficiaryDisplay}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_iban')}</span>
                    <span className="text-sm font-mono text-gray-900 break-all">
                      {bankIbanDisplay}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_bic')}</span>
                    <span className="text-sm text-gray-900">{bankBicDisplay}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_address')}</span>
                    <span className="text-sm text-gray-900 whitespace-pre-line">
                      {bankAddressDisplay}
                    </span>
                  </div>
                </div>
                {payerIbanLastFour ? (
                  <p className="text-xs text-gray-600">
                    {t('sale_summary_bank_transfer_from_account', {
                      lastFour: payerIbanLastFour,
                    })}
                  </p>
                ) : null}
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t.rich('sale_summary_bank_transfer_footer', {
                    termsLink: (chunks) => (
                      <a
                        href={TOKEN_PURCHASE_TERMS_DOC_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
                </p>
                {!user?.walletAddress && sale.product_type === 'token' ? (
                  <div className="flex gap-4 bg-neutral p-6 pb-8 rounded-lg border-t border-gray-100 pt-5">
                    <Info className="flex-shrink-0 w-8 h-8 text-gray-400" />
                    <div className="flex flex-col gap-4 pt-0.5">
                      <p>{t('token_sale_bank_transfer_no_wallet_intro')}</p>
                      <p>
                        {t.rich('token_sale_bank_transfer_no_wallet_step_1', {
                          link: (chunks) => (
                            <a
                              href="https://www.youtube.com/watch?v=f3vwOxSLBUc"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent underline"
                            >
                              {chunks}
                            </a>
                          ),
                        })}
                      </p>
                      <p>{t('token_sale_bank_transfer_no_wallet_step_2')}</p>
                      <Wallet />
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : null}
          </>
        )}

        {saleError && <ErrorMessage error={saleError} />}

        {sale && (
          <Card
            className={`p-4 flex flex-col ${showIssuerBlockInInvoice ? 'gap-0' : 'gap-3'}`}
          >
            {showIssuerBlockInInvoice && issuerEntity && (
              <div className="flex flex-col gap-3">
                <Heading
                  level={3}
                  hasBorder={true}
                  className="!mt-0 mb-4"
                >
                  {t('sale_summary_entity_heading')}
                </Heading>
                {issuerEntity.legalName?.trim() ? (
                  <p className="text-base font-semibold text-gray-900">
                    {issuerEntity.legalName}
                  </p>
                ) : null}
                {issuerEntity.taxNumber ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="card-feature">{t('sale_summary_entity_tax')}</p>
                    <p className="text-sm">{issuerEntity.taxNumber}</p>
                  </div>
                ) : null}
                {issuerEntity.address ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="card-feature">{t('sale_summary_entity_address')}</p>
                    <p className="text-sm whitespace-pre-line">{issuerEntity.address}</p>
                  </div>
                ) : null}
                {issuerEntity.accountingDescription ? (
                  <div className="flex flex-col gap-0.5">
                    <p className="card-feature">{t('sale_summary_entity_description')}</p>
                    <p className="text-sm">{issuerEntity.accountingDescription}</p>
                  </div>
                ) : null}
              </div>
            )}
            <div
              className={
                showIssuerBlockInInvoice
                  ? 'border-t border-divider pt-4 flex flex-col gap-3'
                  : 'flex flex-col gap-3'
              }
            >
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_sale_id')}</p>
                <p className="text-sm font-mono">{sale._id}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('sale_summary_status')}</p>
                <Badge variant={tokenSaleStatusBadgeVariant(sale.status)}>
                  {t(tokenSaleStatusLabelKey(sale.status))}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_type')}</p>
                <p className="text-sm">{sale.product_type}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_payment_method')}</p>
                <p className="text-sm">{sale.paymentMethod || '-'}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_quantity')}</p>
                <p className="text-sm">{sale.quantity ?? '-'}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_total')}</p>
                <p className="text-sm font-semibold">{formattedTotalPrice}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="card-feature">{t('sale_summary_created_at')}</p>
                <p className="text-sm">{createdAt}</p>
              </div>
              {sale.tx_hash && (
                <div className="flex flex-col gap-1">
                  <p className="card-feature">{t('sale_summary_transaction_hash')}</p>
                  <a
                    href={getTransactionExplorerUrl(sale.tx_hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono break-all text-accent underline hover:text-accent-dark"
                  >
                    {sale.tx_hash}
                  </a>
                </div>
              )}
            </div>
          </Card>
        )}

        <Button variant="secondary" onClick={() => router.push('/')}>
          {t('sale_summary_back_home')}
        </Button>
      </div>
    </>
  );
};

SaleSummaryPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, entitiesRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      api.get('/config/accounting-entities').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const generalConfig = generalRes?.data?.results?.value;
    const accountingEntitiesConfig =
      entitiesRes?.data?.results?.value ?? null;
    return {
      generalConfig,
      accountingEntitiesConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      accountingEntitiesConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default SaleSummaryPage;
