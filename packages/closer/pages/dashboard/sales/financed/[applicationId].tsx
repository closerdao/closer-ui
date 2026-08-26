import Head from 'next/head';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';

import AdminLayout from '../../../../components/Dashboard/AdminLayout';
import FinancedApplyPaymentForm from '../../../../components/FinancedApplyPaymentForm';
import { Button, Card, Heading, Input } from '../../../../components/ui';
import { Badge } from '../../../../components/ui/badge';

import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../../401';
import { useAuth } from '../../../../contexts/auth';
import { usePlatform } from '../../../../contexts/platform';
import useRBAC from '../../../../hooks/useRBAC';
import { FinanceApplication, Subscriptions } from '../../../../types/subscriptions';
import api from '../../../../utils/api';
import { parseMessageFromError } from '../../../../utils/common';
import { formatIsoFiatAmount } from '../../../../utils/currencyFormat';
import { getFinancedMonthlyAmountDue, getScheduleMonthAmountDue } from '../../../../utils/financeApplicationMonthlyDue';
import { getNextPaymentDueDateForFinance } from '../../../../utils/financeApplicationScheduleHelpers';
import {
  getFinanceRepaymentProgress,
  getFinanceTotalRepayable,
} from '../../../../utils/financeApplicationTotals';
import {
  getFinanceCancellationSummary,
  isFinanceApplicationCancelled,
} from '../../../../utils/financeCancellation';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
  paymentScheduleRowStatusLabelKey,
} from '../../../../utils/orderStatusBadge';
import { getCachedConfig } from '../../../../utils/cachedConfig.helpers';
import { getPlatformDefaultCurrency } from '../../../../utils/saleCurrency';

const getScheduleRows = (
  paymentsScheduled: FinanceApplication['paymentsScheduled'],
) => {
  return Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      status: value.status,
      amountDue: value.amountDue,
      amountPaid: value.amountPaid,
      paymentDate: value.paymentDate ? new Date(value.paymentDate) : null,
    }));
};

const formatDate = (value?: string | Date | null, locale?: string) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString(locale || 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinancedApplicationDetailPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as
    | Subscriptions
    | null;
  const platformCurrency = getPlatformDefaultCurrency(subscriptionsConfig);
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: any = usePlatform();
  const router = useRouter();
  const intlLocale = router.locale || undefined;
  const { applicationId } = router.query;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distributionAmount, setDistributionAmount] = useState('');
  const [distributionTxHash, setDistributionTxHash] = useState('');
  const [distributionDate, setDistributionDate] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const applicationRaw = platform?.financeapplication?.findOne(applicationId as string);
  const application: FinanceApplication | null = applicationRaw?.toJS
    ? applicationRaw.toJS()
    : applicationRaw || null;

  useEffect(() => {
    if (!applicationId || !platform?.financeapplication) {
      return;
    }
    platform.financeapplication.getOne(applicationId as string);
  }, [applicationId]);

  const paymentScheduleRows = useMemo(
    () => getScheduleRows(application?.paymentsScheduled || {}),
    [application?.paymentsScheduled],
  );
  const monthlyInstallmentDue = useMemo(
    () => getFinancedMonthlyAmountDue(application, paymentScheduleRows.length),
    [application, paymentScheduleRows.length],
  );
  const paidMonths = paymentScheduleRows.filter((row) => row.status === 'paid').length;
  const pendingMonths = paymentScheduleRows.length - paidMonths;
  const nextPaymentDate = application
    ? getNextPaymentDueDateForFinance(application)
    : null;
  const nextPaymentAmount = useMemo(() => {
    if (!nextPaymentDate) {
      return 0;
    }
    const due = nextPaymentDate.getTime();
    const row = paymentScheduleRows.find(
      (item) =>
        item.paymentDate?.getTime() === due && item.status === 'pending',
    );
    return getScheduleMonthAmountDue(row, monthlyInstallmentDue);
  }, [nextPaymentDate, paymentScheduleRows, monthlyInstallmentDue]);
  const totalRepayable = useMemo(
    () => getFinanceTotalRepayable(application),
    [application],
  );
  const cancellationSummary = useMemo(
    () => getFinanceCancellationSummary(application),
    [application],
  );
  const repaymentProgress = getFinanceRepaymentProgress(
    cancellationSummary.totalPaid,
    totalRepayable,
  );
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
  const availableToDistribute = Math.max(tokensAccrued - tokensDistributed, 0);
  const tokenDistributions = application?.tokenDistributions || [];
  const charges = application?.charges || [];
  const paidChargesTotal = charges
    .filter((charge: any) => charge?.status === 'paid')
    .reduce((total: number, charge: any) => total + (charge?.amount?.total?.val || 0), 0);
  const downPaymentAmount = application?.downPaymentAmount || 0;
  const totalContractFiat = application?.totalToPayInFiat || 0;
  const totalContractTokens = application?.tokensToFinance || 0;
  const isFinalRoundReached =
    paymentScheduleRows.length > 0 && paidMonths === paymentScheduleRows.length;
  const effectivePayments = isFinalRoundReached
    ? paidChargesTotal
    : Math.max(paidChargesTotal - downPaymentAmount, 0);
  const effectiveContractFiat = isFinalRoundReached
    ? totalContractFiat
    : Math.max(totalContractFiat - downPaymentAmount, 0);
  const tokensDueByPayments =
    effectiveContractFiat > 0
      ? Number(
          (
            (Math.min(effectivePayments, effectiveContractFiat) / effectiveContractFiat) *
            totalContractTokens
          ).toFixed(6),
        )
      : 0;

  const handleSubmitDistribution = async (event: FormEvent) => {
    event.preventDefault();
    if (!applicationId) {
      return;
    }
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);
    try {
      const body: { amount: number; txHash: string; date?: string } = {
        amount: Number(distributionAmount),
        txHash: distributionTxHash,
      };
      if (distributionDate) {
        body.date = distributionDate;
      }
      const response = await api.post(
        `/token/financeapplication/${applicationId}/token-distribution`,
        body,
      );
      const updated = response?.data?.results;
      if (updated && platform?.financeapplication?.set) {
        platform.financeapplication.set(updated);
      }
      await platform?.financeapplication?.getOne(applicationId as string, { force: true });
      setDistributionAmount('');
      setDistributionTxHash('');
      setDistributionDate('');
      setSubmitSuccess(t('token_sales_dashboard_financed_distribution_success'));
    } catch (error) {
      setSubmitError(parseMessageFromError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !hasAccess('TokenSales')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('token_sales_dashboard_financed_application_detail_title')}</title>
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <Heading level={2}>
              {t('token_sales_dashboard_financed_application_detail_title')}
            </Heading>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard/sales/financed')}
            >
              {t('buttons_back')}
            </Button>
          </div>

          {!application ? (
            <Card>{t('token_sales_dashboard_financed_application_not_found')}</Card>
          ) : (
            <>
              <Card className="flex flex-col gap-4">
                {nextPaymentDate ? (
                  <div className="flex flex-col gap-1 border-b pb-4">
                    <p className="card-feature">
                      {t('token_financed_next_payment_due')}
                    </p>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-2xl font-bold">
                        {formatIsoFiatAmount(
                          nextPaymentAmount,
                          platformCurrency,
                          intlLocale,
                        )}
                      </p>
                      <p className="text-base">
                        {formatDate(nextPaymentDate, intlLocale)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="card-feature">
                      {t('token_financed_repaid_label')}
                    </p>
                    <p className="text-sm">
                      <span className="font-bold">
                        {formatIsoFiatAmount(
                          cancellationSummary.totalPaid,
                          platformCurrency,
                          intlLocale,
                        )}
                      </span>
                      {' / '}
                      {formatIsoFiatAmount(
                        totalRepayable,
                        platformCurrency,
                        intlLocale,
                      )}
                    </p>
                  </div>
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-neutral"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(repaymentProgress * 100)}
                    aria-label={t('token_financed_repaid_label')}
                  >
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${repaymentProgress * 100}%` }}
                    />
                  </div>
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
                {cancellationSummary.isDepositPaid ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_financed_deposit_paid_label')}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatIsoFiatAmount(
                        cancellationSummary.depositAmount,
                        platformCurrency,
                        intlLocale,
                      )}
                    </p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_sales_dashboard_financed_application_id')}
                    </p>
                    <p className="text-xs font-mono">{application._id}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_sales_dashboard_financed_contract_signed_date')}
                    </p>
                    <p className="text-sm">
                      {formatDate(application.created, intlLocale)}
                    </p>
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
                      {t('token_sales_dashboard_financed_total_contract_eur')}
                    </p>
                    <p className="text-sm font-semibold">
                      {formatIsoFiatAmount(
                        application.totalToPayInFiat || 0,
                        platformCurrency,
                        intlLocale,
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_sales_dashboard_financed_paid_months')}
                    </p>
                    <p className="text-sm">{paidMonths}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_sales_dashboard_financed_pending_months')}
                    </p>
                    <p className="text-sm">{pendingMonths}</p>
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
                    <p className="text-sm">{availableToDistribute}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="card-feature">
                      {t('token_sales_dashboard_financed_tokens_due')}
                    </p>
                    <p className="text-sm">{tokensDueByPayments}</p>
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={3} className="mb-0">
                  {t('token_sales_dashboard_financed_payment_schedule')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_schedule_month')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_status')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_schedule_amount_due')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_schedule_amount_paid')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_schedule_payment_date')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentScheduleRows.map((row) => (
                        <tr key={row.month} className="border-b border-gray-100">
                          <td className="p-3 text-sm font-medium">{row.month}</td>
                          <td className="p-3">
                            <Badge variant={row.status === 'paid' ? 'default' : 'secondary'}>
                              {t(
                                paymentScheduleRowStatusLabelKey(
                                  row.status === 'paid' ? 'paid' : 'pending',
                                ),
                              )}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm tabular-nums">
                            {formatIsoFiatAmount(
                              getScheduleMonthAmountDue(row, monthlyInstallmentDue),
                              platformCurrency,
                              intlLocale,
                            )}
                          </td>
                          <td className="p-3 text-sm tabular-nums">
                            {formatIsoFiatAmount(
                              Number(row.amountPaid || 0),
                              platformCurrency,
                              intlLocale,
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(row.paymentDate, intlLocale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={3} className="mb-0">
                  {t('token_sales_dashboard_financed_charge_history')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_charge_date')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_charge_method')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_status')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_charge_amount')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_charge_proof')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {charges.map((charge: any) => {
                        const proofUrl =
                          charge?.meta?.proofOfPaymentUrl ||
                          charge?.meta?.uploadedDocumentUrl ||
                          null;
                        return (
                        <tr key={charge.id || charge._id} className="border-b border-gray-100">
                          <td className="p-3 text-sm">
                            {formatDate(charge.date, intlLocale)}
                          </td>
                          <td className="p-3 text-sm">{charge.method || '-'}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                charge.status === 'paid' ? 'default' : 'secondary'
                              }
                            >
                              {chargeStatusLabel(charge.status)}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm font-medium tabular-nums">
                            {formatIsoFiatAmount(
                              charge?.amount?.total?.val || 0,
                              charge?.amount?.total?.cur || platformCurrency,
                              intlLocale,
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            {proofUrl ? (
                              <a
                                href={proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent underline"
                              >
                                {t('token_sales_dashboard_financed_charge_proof_view')}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={3} className="mb-0">
                  {t('token_sales_dashboard_financed_distribution_history')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_distribution_amount')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_distribution_date')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_distribution_created_by')}
                        </th>
                        <th className="text-left p-3 card-feature font-normal">
                          {t('token_sales_dashboard_financed_distribution_tx_hash')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenDistributions.map((distribution) => (
                        <tr
                          key={`${distribution.txHash}-${distribution.date}`}
                          className="border-b border-gray-100"
                        >
                          <td className="p-3 text-sm font-medium tabular-nums">
                            {distribution.amount}
                          </td>
                          <td className="p-3 text-sm">
                            {formatDate(distribution.date, intlLocale)}
                          </td>
                          <td className="p-3 text-sm">{distribution.createdBy}</td>
                          <td className="p-3 text-xs font-mono break-all">
                            {distribution.txHash}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {user.roles.includes('admin') &&
                !isFinanceApplicationCancelled(application) && (
                  <Card className="flex flex-col gap-3">
                    <FinancedApplyPaymentForm
                      applicationId={String(applicationId)}
                      application={application}
                      onApplied={async (updated) => {
                        if (updated && platform?.financeapplication?.set) {
                          platform.financeapplication.set(updated);
                        }
                        await platform?.financeapplication?.getOne(
                          applicationId as string,
                          { force: true },
                        );
                      }}
                    />
                  </Card>
                )}

              {user.roles.includes('admin') && (
                <Card className="flex flex-col gap-3">
                  <Heading level={3} className="mb-0">
                    {t('token_sales_dashboard_financed_distribution_create')}
                  </Heading>
                  <form onSubmit={handleSubmitDistribution} className="flex flex-col gap-3">
                    <Input
                      type="number"
                      step="any"
                      value={distributionAmount}
                      onChange={(event) => setDistributionAmount(event.target.value)}
                      placeholder={t('token_sales_dashboard_financed_distribution_amount')}
                    />
                    <Input
                      type="text"
                      value={distributionTxHash}
                      onChange={(event) => setDistributionTxHash(event.target.value)}
                      placeholder={t('token_sales_dashboard_financed_distribution_tx_hash')}
                    />
                    <Input
                      type="text"
                      value={distributionDate}
                      onChange={(event) => setDistributionDate(event.target.value)}
                      placeholder={t(
                        'token_sales_dashboard_financed_distribution_date_placeholder',
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        isLoading={isSubmitting}
                        isEnabled={
                          !isSubmitting &&
                          Number(distributionAmount) > 0 &&
                          distributionTxHash.length > 0
                        }
                      >
                        {t('token_sales_dashboard_financed_distribution_submit')}
                      </Button>
                      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                      {submitSuccess && (
                        <p className="text-green-600 text-sm">{submitSuccess}</p>
                      )}
                    </div>
                  </form>
                </Card>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </>
  );
};

FinancedApplicationDetailPage.getInitialProps = async (context: NextPageContext) => {
  try {
    return {};
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      };
  }
};

export default FinancedApplicationDetailPage;
