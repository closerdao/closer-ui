import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

import VillageCard from '../../components/VillageCard';
import {
  EmptyState,
  Eyebrow,
  PageShell,
  btnPrimary,
  btnSecondary,
  inputClass,
} from '../../components/VillageUI';
import { Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { Village } from '../../types/village';
import { fetchVillages } from '../../utils/village.utils';

const VillagesPage = () => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [villages, setVillages] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const canAddVillage =
    isAuthenticated &&
    (Boolean(user?.affiliate) ||
      user?.roles?.includes(AMBASSADOR_ROLE) ||
      user?.roles?.includes('admin'));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results = await fetchVillages({ limit: 100 });
      if (!cancelled) {
        setVillages(results);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return villages;
    return villages.filter((village) =>
      [village.name, village.country, ...(village.tags || [])]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [villages, query]);

  return (
    <>
      <Head>
        <title>{t('villages_page_title')}</title>
      </Head>

      <PageShell width="wide">
        <header className="max-w-2xl">
          <Eyebrow>{t('villages_page_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('villages_page_headline')}{' '}
            <em className="italic text-[#0FA968]">
              {t('villages_page_accent')}
            </em>
          </h1>
          <p className="text-[17px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('villages_page_intro')}
          </p>
        </header>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-9 mb-10">
          <label className="flex-1 max-w-sm">
            <span className="sr-only">{t('villages_search_label')}</span>
            <input
              className={inputClass}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('villages_search_placeholder')}
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:ml-auto">
            <Link href="/map" className={btnSecondary}>
              {t('villages_view_map')}
            </Link>
            <Link
              href={canAddVillage ? '/villages/create' : '/ambassadors'}
              className={btnPrimary}
            >
              {canAddVillage
                ? t('villages_add_cta')
                : t('map_become_ambassador_cta')}
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={query ? t('villages_no_results') : t('villages_empty_title')}
            description={
              query ? t('villages_no_results_body') : t('villages_empty')
            }
            action={{ href: '/map', label: t('villages_view_map') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((village) => (
                <VillageCard key={village._id} village={village} />
              ))}
            </div>
            <p className="text-[13.5px] text-[#5C6E64] mt-8">
              {t('map_result_count', { count: filtered.length })}
            </p>
          </>
        )}
      </PageShell>
    </>
  );
};

export default VillagesPage;
