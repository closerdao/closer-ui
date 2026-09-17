import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import FinanceApplicationSummaryCard from '../../../components/FinanceApplicationSummaryCard';
import { Card, ErrorMessage, Heading, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { GeneralConfig } from '../../../types';
import { FinanceApplication } from '../../../types/subscriptions';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { financeApplicationListFromGetAction } from '../../../utils/platformFinanceApplication';
import PageNotFound from '../../not-found';

const FinancedTokenApplicationsPage = () => {
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const defaultConfig = useConfig();
  const platformName =
    generalConfig?.platformName || defaultConfig.platformName;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { platform } = usePlatform();
  const router = useRouter();
  const platformRef = useRef(platform);
  platformRef.current = platform;
  const listFetchSeq = useRef(0);

  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<FinanceApplication[]>([]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push(`/signup?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    const seq = ++listFetchSeq.current;
    let cancelled = false;

    const load = async () => {
      const finance = platformRef.current?.financeapplication;
      if (!finance) {
        if (!cancelled && seq === listFetchSeq.current) {
          setIsLoadingApplications(false);
        }
        return;
      }
      setError(null);
      setIsLoadingApplications(true);
      try {
        const params = {
          where: { userId: user._id },
          limit: 50,
          sort_by: '-created' as const,
        };
        const action = await finance.get(params, { force: true });
        const rows = financeApplicationListFromGetAction(action);
        if (!cancelled && seq === listFetchSeq.current) {
          setApplications(rows);
        }
      } catch (err: unknown) {
        if (!cancelled && seq === listFetchSeq.current) {
          setError(parseMessageFromError(err));
        }
      } finally {
        if (!cancelled && seq === listFetchSeq.current) {
          setIsLoadingApplications(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user?._id, router.asPath]);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.afterApply === undefined) return;
    if (applications.length === 0) return;
    void router.replace('/token/financed', undefined, { shallow: true });
  }, [applications.length, router, router.isReady, router.query.afterApply]);

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
          <FinanceApplicationSummaryCard
            key={application._id}
            application={application}
          />
        ))}
      </div>
    </>
  );
};

export default FinancedTokenApplicationsPage;
