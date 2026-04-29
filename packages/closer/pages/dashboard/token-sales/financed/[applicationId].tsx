import Head from 'next/head';
import { useRouter } from 'next/router';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import process from 'process';

import AdminLayout from '../../../../components/Dashboard/AdminLayout';
import { Button, Card, Heading, Input } from '../../../../components/ui';
import { Badge } from '../../../../components/ui/badge';

import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../../401';
import { useAuth } from '../../../../contexts/auth';
import { usePlatform } from '../../../../contexts/platform';
import useRBAC from '../../../../hooks/useRBAC';
import { FinanceApplication } from '../../../../types/subscriptions';
import api from '../../../../utils/api';
import { parseMessageFromError } from '../../../../utils/common';
import { formatIsoFiatAmount } from '../../../../utils/currencyFormat';
import { getFinancedMonthlyAmountDue } from '../../../../utils/financeApplicationMonthlyDue';
import { loadLocaleData } from '../../../../utils/locale.helpers';

const getScheduleRows = (
  paymentsScheduled: FinanceApplication['paymentsScheduled'],
) => {
  return Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      status: value.status,
      amountPaid: value.amountPaid,
      paymentDate: value.paymentDate ? new Date(value.paymentDate) : null,
    }));
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const FinancedApplicationDetailPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();
  const { platform }: any = usePlatform();
  const router = useRouter();
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
              onClick={() => router.push('/dashboard/token-sales')}
            >
              {t('buttons_back')}
            </Button>
          </div>

          {!application ? (
            <Card>{t('token_sales_dashboard_financed_application_not_found')}</Card>
          ) : (
            <>
              <Card className="flex flex-col gap-3">
                <p>
                  <strong>{t('token_sales_dashboard_financed_application_id')}:</strong>{' '}
                  {application._id}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_status')}:</strong>{' '}
                  <Badge variant="secondary">{application.status}</Badge>
                </p>
                <p>
                  <strong>
                    {t('token_sales_dashboard_financed_contract_signed_date')}:
                  </strong>{' '}
                  {formatDate(application.created)}
                </p>
                <p>
                  <strong>
                    {t('token_sales_dashboard_financed_total_contract_tokens')}:
                  </strong>{' '}
                  {application.tokensToFinance || 0}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_total_contract_eur')}:</strong>{' '}
                  {formatIsoFiatAmount(application.totalToPayInFiat || 0, 'EUR')}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_paid_months')}:</strong>{' '}
                  {paidMonths}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_pending_months')}:</strong>{' '}
                  {pendingMonths}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_tokens_accrued')}:</strong>{' '}
                  {tokensAccrued}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_tokens_distributed')}:</strong>{' '}
                  {tokensDistributed}
                </p>
                <p>
                  <strong>
                    {t('token_sales_dashboard_financed_tokens_available_to_distribute')}:
                  </strong>{' '}
                  {availableToDistribute}
                </p>
                <p>
                  <strong>{t('token_sales_dashboard_financed_tokens_due')}:</strong>{' '}
                  {tokensDueByPayments}
                </p>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={4}>
                  {t('token_sales_dashboard_financed_payment_schedule')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_schedule_month')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_status')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_schedule_amount_due')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_schedule_payment_date')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentScheduleRows.map((row) => (
                        <tr key={row.month} className="border-b border-border">
                          <td className="p-3">{row.month}</td>
                          <td className="p-3">
                            <Badge variant={row.status === 'paid' ? 'default' : 'secondary'}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {formatIsoFiatAmount(monthlyInstallmentDue, 'EUR')}
                          </td>
                          <td className="p-3">{formatDate(row.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={4}>
                  {t('token_sales_dashboard_financed_charge_history')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_charge_date')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_charge_method')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_status')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_charge_amount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {charges.map((charge: any) => (
                        <tr key={charge.id || charge._id} className="border-b border-border">
                          <td className="p-3">{formatDate(charge.date)}</td>
                          <td className="p-3">{charge.method || '-'}</td>
                          <td className="p-3">{charge.status || '-'}</td>
                          <td className="p-3">
                            {formatIsoFiatAmount(charge?.amount?.total?.val || 0, 'EUR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="flex flex-col gap-3">
                <Heading level={4}>
                  {t('token_sales_dashboard_financed_distribution_history')}
                </Heading>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_distribution_amount')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_distribution_date')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_distribution_created_by')}
                        </th>
                        <th className="text-left p-3">
                          {t('token_sales_dashboard_financed_distribution_tx_hash')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenDistributions.map((distribution) => (
                        <tr
                          key={`${distribution.txHash}-${distribution.date}`}
                          className="border-b border-border"
                        >
                          <td className="p-3">{distribution.amount}</td>
                          <td className="p-3">{formatDate(distribution.date)}</td>
                          <td className="p-3">{distribution.createdBy}</td>
                          <td className="p-3 break-all">{distribution.txHash}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {user.roles.includes('admin') && (
                <Card className="flex flex-col gap-3">
                  <Heading level={4}>
                    {t('token_sales_dashboard_financed_distribution_create')}
                  </Heading>
                  <form onSubmit={handleSubmitDistribution} className="flex flex-col gap-3">
                    <Input
                      type="number"
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
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return { messages };
  } catch (error) {
    return {
      error: parseMessageFromError(error),
      messages: null,
    };
  }
};

export default FinancedApplicationDetailPage;
