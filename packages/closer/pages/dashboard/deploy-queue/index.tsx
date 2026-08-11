import Head from 'next/head';
import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import {
  EmptyState,
  Eyebrow,
  PageShell,
  VillageStatusPill,
  btnSmall,
  btnSmallPrimary,
} from '../../../components/VillageUI';
import { ErrorMessage, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { Village } from '../../../types/village';
import { fetchVillages, updateVillage } from '../../../utils/village.utils';

const isPending = (village: Village) =>
  village.onboardingStatus === 'deploy_requested' ||
  village.onboardingStatus === 'deploying' ||
  village.deployRequest?.status === 'requested';

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const DeployQueuePage = () => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canAccess =
    isAuthenticated &&
    (user?.roles?.includes('admin') ||
      user?.roles?.includes('affiliate-manager'));

  const load = useCallback(async () => {
    const all = await fetchVillages({ limit: 200 });
    setVillages(all.filter(isPending));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!canAccess) return;
    void load();
  }, [canAccess, load]);

  if (!isAuthenticated || !canAccess) return <Page401 />;

  const runAction = async (village: Village, payload: Partial<Village>) => {
    try {
      setActingId(village._id);
      setError(null);
      await updateVillage(village._id, payload);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('villages_action_error'));
    } finally {
      setActingId(null);
    }
  };

  const markDeploying = (village: Village) =>
    runAction(village, {
      onboardingStatus: 'deploying',
      deployRequest: {
        ...(village.deployRequest || {}),
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: user?._id,
      },
    } as Partial<Village>);

  const markLive = (village: Village) =>
    runAction(village, {
      onboardingStatus: 'live',
      closer: true,
      deployRequest: {
        ...(village.deployRequest || {}),
        status: 'completed',
        processedAt: new Date().toISOString(),
        processedBy: user?._id,
      },
    } as Partial<Village>);

  return (
    <>
      <Head>
        <title>{t('deploy_queue_title')}</title>
      </Head>

      <PageShell>
        <header className="max-w-2xl">
          <Eyebrow>{t('deploy_queue_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('deploy_queue_title')}
          </h1>
          <p className="text-[17px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('deploy_queue_intro')}
          </p>
        </header>

        {!isLoading && villages.length > 0 ? (
          <p className="text-[13.5px] font-semibold text-[#0B7A4C] mt-8">
            {t('deploy_queue_count', { count: villages.length })}
          </p>
        ) : null}

        {error ? (
          <div className="mt-6">
            <ErrorMessage error={error} />
          </div>
        ) : null}

        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : villages.length === 0 ? (
            <EmptyState
              title={t('deploy_queue_empty_title')}
              description={t('deploy_queue_empty')}
              action={{ href: '/villages', label: t('villages_page_title') }}
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {villages.map((village) => {
                const requestedAt = formatDate(
                  village.deployRequest?.requestedAt,
                );
                const isBusy = actingId === village._id;
                return (
                  <li
                    key={village._id}
                    className="bg-white border border-[#C2F0DA] rounded-[22px] p-6 flex flex-col lg:flex-row lg:items-center gap-5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2.5">
                        <VillageStatusPill status={village.onboardingStatus} />
                        {requestedAt ? (
                          <span className="text-[12.5px] text-[#5C6E64]">
                            {t('deploy_queue_requested_at', {
                              date: requestedAt,
                            })}
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/villages/${village.slug || village._id}`}
                        className="font-serif text-2xl text-[#10201A] hover:text-[#0B7A4C] transition-colors"
                      >
                        {village.name}
                      </Link>
                      <p className="text-[12.5px] uppercase tracking-[0.12em] text-[#5C6E64] mt-1.5">
                        {village.country}
                      </p>
                      {village.deployRequest?.notes ? (
                        <p className="text-[13.5px] text-[#5C6E64] mt-3 leading-relaxed">
                          {village.deployRequest.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2.5 lg:flex-none">
                      {village.onboardingStatus !== 'deploying' ? (
                        <button
                          type="button"
                          className={btnSmall}
                          disabled={isBusy}
                          onClick={() => markDeploying(village)}
                        >
                          {t('deploy_queue_mark_deploying')}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={btnSmallPrimary}
                        disabled={isBusy}
                        onClick={() => markLive(village)}
                      >
                        {t('deploy_queue_mark_live')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PageShell>
    </>
  );
};

export default DeployQueuePage;
