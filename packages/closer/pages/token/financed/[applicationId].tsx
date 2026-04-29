import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { Info } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import Wallet from '../../../components/Wallet';
import { Button, Card, ErrorMessage, Heading, Spinner } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { AccountingEntitiesConfig, TokenSale } from '../../../types/api';
import { FinanceApplication } from '../../../types/subscriptions';
import { resolveAccountingEntityFromSale } from '../../../utils/accountingEntityResolve';
import api, { formatSearch } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import {
  formatIsoFiatAmount,
  isIso4217Currency,
} from '../../../utils/currencyFormat';
import { resolveDepositTokenSaleForFinanceApplication } from '../../../utils/financeDepositSaleResolve';
import { getFinancedMonthlyAmountDue } from '../../../utils/financeApplicationMonthlyDue';
import { loadLocaleData } from '../../../utils/locale.helpers';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
  paymentScheduleRowStatusLabelKey,
} from '../../../utils/orderStatusBadge';
import { TOKEN_PURCHASE_TERMS_DOC_URL } from '../../../constants';
import PageNotFound from '../../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
  accountingEntitiesConfig: AccountingEntitiesConfig | null;
}

const getScheduleEntries = (paymentsScheduled: FinanceApplication['paymentsScheduled']) =>
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
  const nextFuture = pendingSorted.find((item) => item.paymentDate && item.paymentDate >= now);
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

const FinancedTokenApplicationPage = ({
  generalConfig,
  accountingEntitiesConfig,
}: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { platform } = usePlatform();
  const router = useRouter();
  const { applicationId } = router.query;
  const id = typeof applicationId === 'string' ? applicationId : '';

  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<FinanceApplication | null>(null);
  const [depositSale, setDepositSale] = useState<TokenSale | null>(null);

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
    if (!platform?.financeapplication) {
      setIsLoadingApplication(false);
      return;
    }
    (async () => {
      setError(null);
      setIsLoadingApplication(true);
      try {
        const params = {
          where: { _id: id, userId: user._id },
          limit: 1,
        };
        const action = await platform.financeapplication.get(params, {
          force: true,
        });
        const rows = financeApplicationListFromGetAction(action);
        const first = (rows[0] || null) as FinanceApplication | null;
        if (!first) {
          setError(t('token_financed_not_found'));
          return;
        }
        setApplication(first);
      } catch (err: unknown) {
        setError(parseMessageFromError(err));
      } finally {
        setIsLoadingApplication(false);
      }
    })();
  }, [isAuthLoading, router.isReady, user, id, router, t]);

  useEffect(() => {
    if (!application || application.status !== 'pending-payment' || !user?._id) {
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
  const nextPaymentDate = application ? getNextPaymentDueDate(application) : null;
  const paidChargesTotal = (application?.charges || [])
    .filter((charge: { status?: string }) => charge?.status === 'paid')
    .reduce(
      (total: number, charge: { amount?: { total?: { val?: number } } }) =>
        total + (charge?.amount?.total?.val || 0),
      0,
    );
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
  const bankBicDisplay =
    issuerEntity?.bic?.trim() || t('oasa_bic_value');
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
        <title>{`${t('token_financed_contract_title')} - ${platformName}`}</title>
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
                <p className="card-feature">{t('token_sales_dashboard_financed_application_id')}</p>
                <p className="text-xs font-mono">{application._id}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_status')}</p>
                <Badge variant={financeApplicationStatusBadgeVariant(application.status)}>
                  {t(financeApplicationStatusLabelKey(application.status))}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_next_payment_date')}</p>
                <p className="text-sm">{formatDate(nextPaymentDate)}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_pending_months')}</p>
                <p className="text-sm">{pendingMonths}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_paid_months')}</p>
                <p className="text-sm">{paidMonths}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_total_contract_tokens')}</p>
                <p className="text-sm font-semibold">{application.tokensToFinance || 0}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_tokens_accrued')}</p>
                <p className="text-sm">{tokensAccrued}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_tokens_distributed')}</p>
                <p className="text-sm">{tokensDistributed}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_tokens_available_to_distribute')}</p>
                <p className="text-sm">{tokensAvailable}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_sales_dashboard_financed_total_contract_eur')}</p>
                <p className="text-sm font-semibold">
                  {formatIsoFiatAmount(application.totalToPayInFiat || 0, 'EUR')}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="card-feature">{t('token_financed_amount_paid')}</p>
                <p className="text-sm">{formatIsoFiatAmount(paidChargesTotal, 'EUR')}</p>
              </div>
            </Card>

            {scheduleRows.length > 0 && (
              <Card className="p-4 flex flex-col gap-3">
                <Heading level={3} className="mb-0">
                  {t('token_sales_dashboard_financed_payment_schedule')}
                </Heading>
                <div className="flex flex-col gap-2">
                  {scheduleRows.map((row) => (
                    <div key={row.month} className="border border-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{row.month}</p>
                        <Badge variant={row.status === 'paid' ? 'default' : 'secondary'}>
                          {t(
                            paymentScheduleRowStatusLabelKey(
                              row.status === 'paid' ? 'paid' : 'pending',
                            ),
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {t('token_sales_dashboard_financed_schedule_payment_date')}
                        </p>
                        <p className="text-xs">{formatDate(row.paymentDate)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1">
                        <p className="text-xs text-gray-500">
                          {t('token_sales_dashboard_financed_schedule_amount_due')}
                        </p>
                        <p className="text-xs">
                          {formatIsoFiatAmount(monthlyInstallmentDue, 'EUR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
        <Button variant="secondary" onClick={() => router.push('/token/financed')}>
          {t('token_financed_back_to_list')}
        </Button>
      </div>
    </>
  );
};

FinancedTokenApplicationPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, entitiesRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      api.get('/config/accounting-entities').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;
    const accountingEntitiesConfig =
      entitiesRes?.data?.results?.value ?? null;
    return { generalConfig, accountingEntitiesConfig, messages };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      accountingEntitiesConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default FinancedTokenApplicationPage;
