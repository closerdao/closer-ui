import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { Button, Card, ErrorMessage, Heading, Spinner } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { FinanceApplication } from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import { formatIsoFiatAmount } from '../../../utils/currencyFormat';
import {
  financeApplicationStatusBadgeVariant,
  financeApplicationStatusLabelKey,
} from '../../../utils/orderStatusBadge';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  generalConfig: GeneralConfig | null;
}

const getScheduleEntries = (paymentsScheduled: FinanceApplication['paymentsScheduled']) =>
  Object.entries(paymentsScheduled || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({
      month,
      ...value,
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

const FinancedTokenApplicationsPage = ({ generalConfig }: Props) => {
  const t = useTranslations();
  const defaultConfig = useConfig();
  const platformName = generalConfig?.platformName || defaultConfig.platformName;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { platform } = usePlatform();
  const router = useRouter();

  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<FinanceApplication[]>([]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!platform?.financeapplication) {
      setIsLoadingApplications(false);
      return;
    }
    (async () => {
      setError(null);
      setIsLoadingApplications(true);
      try {
        const params = {
          where: { userId: user._id },
          limit: 50,
          sort_by: '-created' as const,
        };
        const action = await platform.financeapplication.get(params);
        const rows = financeApplicationListFromGetAction(action);
        setApplications(rows);
      } catch (err: unknown) {
        setError(parseMessageFromError(err));
      } finally {
        setIsLoadingApplications(false);
      }
    })();
  }, [isAuthLoading, user, router]);

  const activeApplications = useMemo(
    () =>
      applications.filter((app) =>
        ['pending-payment', 'paid', 'up-to-date', 'delinquent', 'pending'].includes(app.status),
      ),
    [applications],
  );

  if (process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP !== 'true') {
    return <PageNotFound error="" />;
  }

  if (isAuthLoading || isLoadingApplications) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{`${t('token_financed_page_title')} - ${platformName}`}</title>
      </Head>
      <div className="w-full max-w-screen-sm mx-auto py-8 px-4 flex flex-col gap-6">
        <Heading level={1}>{t('token_financed_page_title')}</Heading>
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {t('token_financed_page_subtitle')}
        </p>
        {error && <ErrorMessage error={error} />}
        {!error && applications.length === 0 && (
          <Card className="p-4 text-sm text-gray-700">
            {t('token_financed_empty_state')}
          </Card>
        )}
        {applications.map((application) => (
          <Card key={application._id} className="p-4 flex flex-col gap-3">
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
              <p className="card-feature">{t('token_sales_dashboard_financed_total_contract_tokens')}</p>
              <p className="text-sm">{application.tokensToFinance || 0}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="card-feature">{t('token_sales_dashboard_financed_total_contract_eur')}</p>
              <p className="text-sm font-semibold">
                {formatIsoFiatAmount(application.totalToPayInFiat || 0, 'EUR')}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="card-feature">{t('token_sales_dashboard_financed_next_payment_date')}</p>
              <p className="text-sm">{formatDate(getNextPaymentDueDate(application))}</p>
            </div>
            <Link
              href={`/token/financed/${encodeURIComponent(application._id)}`}
              className="text-sm text-accent underline"
            >
              {t('token_financed_view_contract')}
            </Link>
          </Card>
        ))}
        {activeApplications.length > 0 && (
          <Button variant="secondary" onClick={() => router.push('/token/finance')}>
            {t('token_financed_apply_another')}
          </Button>
        )}
      </div>
    </>
  );
};

FinancedTokenApplicationsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [generalRes, messages] = await Promise.all([
      api.get('/config/general').catch(() => null),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const generalConfig = generalRes?.data?.results?.value;
    return { generalConfig, messages };
  } catch (err: unknown) {
    return {
      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default FinancedTokenApplicationsPage;
