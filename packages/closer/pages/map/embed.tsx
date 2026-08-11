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

const MapEmbedPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const curator = typeof router.query.curator === 'string' ? router.query.curator : '';
  const [projects, setProjects] = useState<VillageMapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const apiProjects = await fetchVillages({ limit: 200 });
      if (cancelled) return;
      const fromApi = apiProjects
        .map((project) => villageToMapItem(project))
        .filter((project): project is VillageMapItem => Boolean(project));
      setProjects(fromApi.length > 0 ? fromApi : getStaticFallback());
      setIsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>{t('map_page_title')}</title>
      </Head>
      <div className="w-full min-h-screen flex flex-col gap-3 p-3 bg-white">
        {curator ? (
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {curator}
          </p>
        ) : null}
        <Heading level={2}>{t('map_page_title')}</Heading>
        <p className="text-sm text-gray-600">{t('map_embed_intro')}</p>
        {isLoading ? (
          <Spinner />
        ) : (
          <div className="h-[80vh] min-h-[360px] border border-gray-200 rounded-lg overflow-hidden">
            <CommunityMap projects={projects} />
          </div>
        )}
      </div>
    </>
  );
};

export default MapEmbedPage;
