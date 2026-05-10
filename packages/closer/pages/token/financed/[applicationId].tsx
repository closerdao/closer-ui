import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import Wallet from '../../../components/Wallet';
import {
  Button,
  Card,
  ErrorMessage,
  Heading,
  Spinner,
} from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';

import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { TOKEN_PURCHASE_TERMS_DOC_URL } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { AccountingEntitiesConfig, TokenSale } from '../../../types/api';
import { Charge } from '../../../types/booking';
import { FinanceApplication } from '../../../types/subscriptions';
import { resolveAccountingEntityFromSale } from '../../../utils/accountingEntityResolve';
import api, { formatSearch } from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  formatIsoFiatAmount,
  isIso4217Currency,
} from '../../../utils/currencyFormat';
import { getFinancedMonthlyAmountDue } from '../../../utils/financeApplicationMonthlyDue';
import { resolveDepositTokenSaleForFinanceApplication } from '../../../utils/financeDepositSaleResolve';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
  paymentScheduleRowStatusLabelKey,
} from '../../../utils/orderStatusBadge';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import PageNotFound from '../../not-found';

const COLLAPSED_ITEMS_LIMIT = 3;

const financedExpandToggleClassName =
  'inline-flex items-center gap-1 self-start rounded border border-gray-900 px-2 py-1 text-xs text-gray-900 hover:bg-black/[0.04]';

const chargeSortEpoch = (charge: Charge) => {
  const raw = charge.date as unknown as string | Date | undefined;
  if (!raw) return 0;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
};

const getScheduleEntries = (
  paymentsScheduled: FinanceApplication['paymentsScheduled'],
) =>
  Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      status: value.status,
      amountPaid: value.amountPaid,
      paymentDate: value.paymentDate ? new Date(value.paymentDate) : null,
    }));

const getNextPaymentDueDate = (application: FinanceApplication) => {
  const schedule = getScheduleEntries(application.paymentsScheduled);
  const now = new Date();
  const pendingSorted = schedule.filter(
    (item) => item.status === 'pending' && item.paymentDate,
  );
  const nextFuture = pendingSorted.find(
    (item) => item.paymentDate && item.paymentDate >= now,
  );
  return nextFuture?.paymentDate || pendingSorted[0]?.paymentDate || null;
};

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinancedTokenApplicationPage = () => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const accountingEntitiesConfig =
    getCachedConfig('accounting-entities') as AccountingEntitiesConfig | null;
  const t = useTranslations();
  const defaultConfig = useConfig();
  const platformName =
    generalConfig?.platformName || defaultConfig.platformName;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { platform } = usePlatform();
  const router = useRouter();
  const platformRef = useRef(platform);
  platformRef.current = platform;
  const detailFetchSeq = useRef(0);
  const { applicationId } = router.query;
  const id = typeof applicationId === 'string' ? applicationId : '';

  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<FinanceApplication | null>(
    null,
  );
  const [depositSale, setDepositSale] = useState<TokenSale | null>(null);
  const [linkedCharges, setLinkedCharges] = useState<Charge[]>([]);
  const [linkedChargesLoading, setLinkedChargesLoading] = useState(false);
  const [chargesExpanded, setChargesExpanded] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  useEffect(() => {
    if (isAuthLoading || !router.isReady) return;
    if (!user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!id) {
      setError(t('token_financed_not_found'));
      setIsLoadingApplication(false);
      return;
    }
    const seq = ++detailFetchSeq.current;
    let cancelled = false;

    const load = async () => {
      const finance = platformRef.current?.financeapplication;
      if (!finance) {
        if (!cancelled && seq === detailFetchSeq.current) {
          setIsLoadingApplication(false);
        }
        return;
      }
      setError(null);
      setIsLoadingApplication(true);
      try {
        const params = {
          where: { _id: id, userId: user._id },
          limit: 1,
        };
        const action = await finance.get(params, {
          force: true,
        });
        const rows = financeApplicationListFromGetAction(action);
        const first = (rows[0] || null) as FinanceApplication | null;
        if (!cancelled && seq === detailFetchSeq.current) {
          if (!first) {
            setError(t('token_financed_not_found'));
            setApplication(null);
          } else {
            setApplication(first);
          }
        }
      } catch (err: unknown) {
        if (!cancelled && seq === detailFetchSeq.current) {
          setError(parseMessageFromError(err));
        }
      } finally {
        if (!cancelled && seq === detailFetchSeq.current) {
          setIsLoadingApplication(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, router.isReady, user?._id, id, router.asPath, t]);

  useEffect(() => {
    if (
      !application ||
      application.status !== 'pending-payment' ||
      !user?._id
    ) {
      setDepositSale(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/sale', {
          params: {
            where: formatSearch({
              createdBy: user._id,
              product_type: 'token',
              status: 'pending-payment',
            }),
            sort: '-created',
            limit: 40,
          },
        });
        const rows = Array.isArray(res?.data?.results) ? res.data.results : [];
        const resolved = resolveDepositTokenSaleForFinanceApplication(
          application,
          rows as TokenSale[],
        );
        if (!cancelled) {
          setDepositSale(resolved);
        }
      } catch {
        if (!cancelled) {
          setDepositSale(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [application, user?._id]);

  useEffect(() => {
    if (!application?._id || !user?._id) {
      setLinkedCharges([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLinkedChargesLoading(true);
      try {
        const res = await api.get('/charge', {
          params: {
            where: formatSearch({
              linkedObjectType: 'FinanceApplication',
              linkedObjectId: application._id,
            }),
            sort: '-date',
            limit: 100,
          },
          cache: false,
        } as Parameters<typeof api.get>[1]);
        const rows = Array.isArray(res?.data?.results) ? res.data.results : [];
        const normalized = [...(rows as Charge[])].sort(
          (a, b) => chargeSortEpoch(b) - chargeSortEpoch(a),
        );
        if (!cancelled) {
          setLinkedCharges(normalized);
        }
      } catch {
        if (!cancelled) {
          setLinkedCharges([]);
        }
      } finally {
        if (!cancelled) {
          setLinkedChargesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [application?._id, user?._id]);

  useEffect(() => {
    setChargesExpanded(false);
    setScheduleExpanded(false);
  }, [application?._id]);

  const scheduleRows = useMemo(
    () => getScheduleEntries(application?.paymentsScheduled || {}),
    [application?.paymentsScheduled],
  );
  const monthlyInstallmentDue = useMemo(
    () => getFinancedMonthlyAmountDue(application, scheduleRows.length),
    [application, scheduleRows.length],
  );
  const paidMonths = scheduleRows.filter((row) => row.status === 'paid').length;
  const pendingMonths = scheduleRows.length - paidMonths;
  const nextPaymentDate = application
    ? getNextPaymentDueDate(application)
    : null;
  const paidChargesTotal = (application?.charges || [])
    .filter((charge: { status?: string }) => charge?.status === 'paid')
    .reduce(
      (total: number, charge: { amount?: { total?: { val?: number } } }) =>
        total + (charge?.amount?.total?.val || 0),
      0,
    );
  const depositAmount = Number(application?.downPaymentAmount || 0);
  const isDepositPaid =
    !!application &&
    depositAmount > 0 &&
    (application.isDownPaymentMade === true ||
      (application.status !== 'pending-payment' &&
        application.status !== 'pending'));
  const visibleScheduleRows = useMemo(() => {
    if (scheduleExpanded || scheduleRows.length <= COLLAPSED_ITEMS_LIMIT) {
      return scheduleRows;
    }
    return scheduleRows.slice(0, COLLAPSED_ITEMS_LIMIT);
  }, [scheduleRows, scheduleExpanded]);
  const visibleLinkedCharges = useMemo(() => {
    if (chargesExpanded || linkedCharges.length <= COLLAPSED_ITEMS_LIMIT) {
      return linkedCharges;
    }
    return linkedCharges.slice(0, COLLAPSED_ITEMS_LIMIT);
  }, [linkedCharges, chargesExpanded]);

  const chargeStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'paid':
        return t('order_status_paid');
      case 'pending-payment':
        return t('order_status_pending_payment');
      case 'canceled':
      case 'cancelled':
        return t('order_status_cancelled');
      case 'completed':
        return t('order_status_completed');
      default:
        return status || '-';
    }
  };
  const tokensAccrued = application?.tokensAccrued || 0;
  const tokensDistributed = application?.tokensDistributed || 0;
  const tokensAvailable = Math.max(tokensAccrued - tokensDistributed, 0);

  const issuerEntity = useMemo(
    () =>
      resolveAccountingEntityFromSale(
        depositSale?.entity,
        accountingEntitiesConfig?.elements,
      ),
    [depositSale?.entity, accountingEntitiesConfig?.elements],
  );

  const invoiceCurrency = useMemo(() => {
    const raw = depositSale?.currency?.trim();
    if (!raw) return 'EUR';
    const upper = raw.toUpperCase();
    return isIso4217Currency(upper) ? upper : 'EUR';
  }, [depositSale?.currency]);

  const depositReminderMemo = useMemo(() => {
    const fromSale = depositSale?.memoCode?.trim() ?? '';
    const fromApp = application?.memoCode?.trim() ?? '';
    return fromSale || fromApp;
  }, [depositSale?.memoCode, application?.memoCode]);

  const bankInstructionsFormattedAmount = useMemo(() => {
    if (!application || application.status !== 'pending-payment') {
      return '';
    }
    if (depositSale) {
      return formatIsoFiatAmount(
        Number(depositSale.total_price),
        invoiceCurrency,
        router.locale || undefined,
        { min: 2, max: 2 },
      );
    }
    const down = Number(application.downPaymentAmount || 0);
    return formatIsoFiatAmount(down, 'EUR', router.locale || undefined, {
      min: 2,
      max: 2,
    });
  }, [application, depositSale, invoiceCurrency, router.locale]);

  const payerIbanLastFour = useMemo(() => {
    const iban = application?.iban?.replace(/\s/g, '') ?? '';
    return iban.length >= 4 ? iban.slice(-4) : '';
  }, [application?.iban]);

  const bankBeneficiaryDisplay =
    issuerEntity?.legalName?.trim() || t('oasa_beneficiary_name');
  const bankIbanDisplay =
    issuerEntity?.iban?.trim() ||
    process.env.NEXT_PUBLIC_CLOSER_IBAN ||
    t('oasa_iban_value');
  const bankBicDisplay = issuerEntity?.bic?.trim() || t('oasa_bic_value');
  const bankAddressDisplay =
    issuerEntity?.address?.trim() || t('oasa_address_value');

  const showDepositBankReminder = application?.status === 'pending-payment';

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    return <PageNotFound error="" />;
  }

  if (isAuthLoading || isLoadingApplication) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>{`${t(
          'token_financed_contract_title',
        )} - ${platformName}`}</title>
      </Head>
      <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex flex-col gap-6">
        <Heading level={1}>{t('token_financed_contract_title')}</Heading>
        {error && <ErrorMessage error={error} />}
        {application && (
          <>
            {showDepositBankReminder ? (
              <Card className="p-4 flex flex-col gap-5">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {t('token_financed_deposit_reminder_intro')}
                </p>
                {depositReminderMemo ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">
                      {t('sale_summary_bank_transfer_reference_label')}
                    </p>
                    <p className="text-xl font-mono font-semibold text-gray-900 mt-1 tracking-wide">
                      {depositReminderMemo}
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
                  <span className="card-feature">
                    {t('sale_summary_total')}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {bankInstructionsFormattedAmount}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">
                      {t('oasa_beneficiary')}
                    </span>
                    <span className="text-sm text-gray-900">
                      {bankBeneficiaryDisplay}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_iban')}</span>
                    <span className="text-sm font-mono text-gray-900 break-all">
                      {bankIbanDisplay}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="card-feature">{t('oasa_bic')}</span>
                    <span className="text-sm text-gray-900">
                      {bankBicDisplay}
                    </span>
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
                  {t.rich('token_financed_bank_transfer_footer', {
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
                {!user?.walletAddress ? (
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

            <Card className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_application_id')}
                </p>
                <p className="text-xs font-mono">{application._id}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_status')}
                </p>
                <Badge
                  variant={financeApplicationStatusBadgeVariant(
                    application.status,
                  )}
                >
                  {t(financeApplicationStatusLabelKey(application.status))}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_next_payment_date')}
                </p>
                <p className="text-sm">{formatDate(nextPaymentDate)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_pending_months')}
                </p>
                <p className="text-sm">{pendingMonths}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_paid_months')}
                </p>
                <p className="text-sm">{paidMonths}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_total_contract_tokens')}
                </p>
                <p className="text-sm font-semibold">
                  {application.tokensToFinance || 0}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_tokens_accrued')}
                </p>
                <p className="text-sm">{tokensAccrued}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_tokens_distributed')}
                </p>
                <p className="text-sm">{tokensDistributed}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t(
                    'token_sales_dashboard_financed_tokens_available_to_distribute',
                  )}
                </p>
                <p className="text-sm">{tokensAvailable}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_sales_dashboard_financed_total_contract_eur')}
                </p>
                <p className="text-sm font-semibold">
                  {formatIsoFiatAmount(
                    application.totalToPayInFiat || 0,
                    'EUR',
                  )}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">
                  {t('token_financed_amount_paid')}
                </p>
                <p className="text-sm">
                  {formatIsoFiatAmount(paidChargesTotal, 'EUR')}
                </p>
              </div>
              {isDepositPaid ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="card-feature">
                    {t('token_financed_deposit_paid_label')}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatIsoFiatAmount(depositAmount, 'EUR')}
                  </p>
                </div>
              ) : null}
            </Card>

            <Card className="p-4 flex flex-col gap-3">
              <Heading level={3} className="mb-0">
                {t('token_sales_dashboard_financed_charge_history')}
              </Heading>
              {linkedChargesLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner />
                </div>
              ) : linkedCharges.length === 0 ? (
                <p className="text-sm text-gray-600">-</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    {visibleLinkedCharges.map((charge) => (
                      <div
                        key={charge._id || charge.id}
                        className="border border-gray-100 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-gray-500">
                            {t('token_sales_dashboard_financed_charge_date')}
                          </p>
                          <p className="text-sm">{formatDate(charge.date)}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {t('token_sales_dashboard_financed_charge_method')}
                          </p>
                          <p className="text-sm">{charge.method || '-'}</p>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {t('token_sales_dashboard_status')}
                          </p>
                          <Badge
                            variant={
                              charge.status === 'paid' ? 'default' : 'secondary'
                            }
                          >
                            {chargeStatusLabel(charge.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <p className="text-xs text-gray-500">
                            {t('token_sales_dashboard_financed_charge_amount')}
                          </p>
                          <p className="text-sm font-medium tabular-nums">
                            {formatIsoFiatAmount(
                              charge?.amount?.total?.val || 0,
                              'EUR',
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {linkedCharges.length > COLLAPSED_ITEMS_LIMIT ? (
                    <button
                      type="button"
                      className={financedExpandToggleClassName}
                      onClick={() => setChargesExpanded((v) => !v)}
                      aria-expanded={chargesExpanded}
                    >
                      {chargesExpanded ? (
                        <>
                          <ChevronUp
                            className="w-3.5 h-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span>{t('token_financed_show_less')}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown
                            className="w-3.5 h-3.5 shrink-0"
                            strokeWidth={2}
                            aria-hidden
                          />
                          <span>
                            {t('token_financed_show_all_charges', {
                              count: linkedCharges.length,
                            })}
                          </span>
                        </>
                      )}
                    </button>
                  ) : null}
                </>
              )}
            </Card>

            {scheduleRows.length > 0 && (
              <Card className="p-4 flex flex-col gap-3">
                <Heading level={3} className="mb-0">
                  {t('token_sales_dashboard_financed_payment_schedule')}
                </Heading>
                <div className="flex flex-col gap-2">
                  {visibleScheduleRows.map((row) => (
                    <div
                      key={row.month}
                      className="border border-gray-100 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{row.month}</p>
                        <Badge
                          variant={
                            row.status === 'paid' ? 'default' : 'secondary'
                          }
                        >
                          {t(
                            paymentScheduleRowStatusLabelKey(
                              row.status === 'paid' ? 'paid' : 'pending',
                            ),
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {t(
                            'token_sales_dashboard_financed_schedule_payment_date',
                          )}
                        </p>
                        <p className="text-xs">{formatDate(row.paymentDate)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {t(
                            'token_sales_dashboard_financed_schedule_amount_due',
                          )}
                        </p>
                        <p className="text-xs">
                          {formatIsoFiatAmount(monthlyInstallmentDue, 'EUR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {scheduleRows.length > COLLAPSED_ITEMS_LIMIT ? (
                  <button
                    type="button"
                    className={financedExpandToggleClassName}
                    onClick={() => setScheduleExpanded((v) => !v)}
                    aria-expanded={scheduleExpanded}
                  >
                    {scheduleExpanded ? (
                      <>
                        <ChevronUp
                          className="w-3.5 h-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span>{t('token_financed_show_less')}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown
                          className="w-3.5 h-3.5 shrink-0"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span>
                          {t('token_financed_show_all_payments', {
                            count: scheduleRows.length,
                          })}
                        </span>
                      </>
                    )}
                  </button>
                ) : null}
              </Card>
            )}
          </>
        )}
        <Button
          variant="secondary"
          onClick={() => router.push('/token/financed')}
        >
          {t('token_financed_back_to_list')}
        </Button>
      </div>
    </>
  );
};

export default FinancedTokenApplicationPage;
