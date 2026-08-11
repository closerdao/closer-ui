import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CommunityMap from '../../components/CommunityMap';
import { Heading, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import staticVillages from '../../data/staticVillages';
import { VillageMapItem } from '../../types/village';
import {
  fetchVillages,
  villageToMapItem,
} from '../../utils/village.utils';

const getStaticFallback = (): VillageMapItem[] =>
  staticVillages
    .map((project) => villageToMapItem(project))
    .filter((project): project is VillageMapItem => Boolean(project));

const MapPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const [projects, setProjects] = useState<VillageMapItem[]>(getStaticFallback);
  const [isLoading, setIsLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [closerOnly, setCloserOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const apiProjects = await fetchVillages({
        limit: 200,
        country: country || undefined,
      });
      if (cancelled) return;
      const fromApi = apiProjects
        .map((project) => villageToMapItem(project))
        .filter((project): project is VillageMapItem => Boolean(project));
      const items = (fromApi.length > 0 ? fromApi : getStaticFallback()).filter(
        (project) => {
          const countryOk = country
            ? project.country.toLowerCase().includes(country.toLowerCase())
            : true;
          const closerOk = closerOnly ? Boolean(project.closer) : true;
          return countryOk && closerOk;
        },
      );
      setProjects(items);
      setIsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [country, closerOnly]);

  return (
    <>
      <Head>
        <title>{t('map_page_title')}</title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{t('map_page_title')}</Heading>
          <p className="text-gray-600 max-w-2xl">{t('map_page_intro')}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('map_filter_country')}</span>
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Portugal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm pb-2">
            <input
              type="checkbox"
              checked={closerOnly}
              onChange={(e) => setCloserOnly(e.target.checked)}
            />
            {t('map_filter_closer_only')}
          </label>
          <button
            type="button"
            className="text-sm text-accent underline pb-2"
            onClick={() => router.push('/villages/create')}
          >
            {t('map_add_village_cta')}
          </button>
        </div>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="h-[70vh] min-h-[420px] rounded-xl overflow-hidden border border-gray-200">
            <CommunityMap projects={projects} />
          </div>
        )}
      </div>
    </>
  );
};

export default MapPage;
