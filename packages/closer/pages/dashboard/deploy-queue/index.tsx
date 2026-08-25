import Head from 'next/head';
import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import {
  EmptyState,
  Eyebrow,
  PageShell,
  VillageStatusPill,
  btnSmall,
} from '../../../components/VillageUI';
import { Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { Village } from '../../../types/village';
import { fetchVillages } from '../../../utils/village.utils';

/**
 * Read-only since the deploy CTA landed (#1027): procurement writes the
 * outcome onto the Village itself, so there is nothing here left to mark by
 * hand. `failed` is in the list because a stuck deploy is exactly what an
 * admin opens this page to find.
 */
const isPending = (village: Village) =>
  village.onboardingStatus === 'deploy_requested' ||
  village.onboardingStatus === 'deploying' ||
  village.onboardingStatus === 'failed' ||
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
                      {village.deployError ? (
                        <p className="text-[12.5px] font-mono text-[#9B2C2C] mt-3 break-words">
                          {village.deployError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2.5 lg:flex-none">
                      <Link
                        href={`/villages/${village.slug || village._id}`}
                        className={btnSmall}
                      >
                        {t('deploy_queue_open_village')}
                      </Link>
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
