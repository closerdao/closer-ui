import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import LandProjectCard from '../../components/LandProjectCard';
import { Heading, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { LandProject } from '../../types/landProject';
import { fetchLandProjects } from '../../utils/landProject.utils';

const VillagesPage = () => {
  const t = useTranslations();
  const [projects, setProjects] = useState<LandProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const results = await fetchLandProjects({ limit: 100 });
      if (!cancelled) {
        setProjects(results);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Head>
        <title>{t('villages_page_title')}</title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{t('villages_page_title')}</Heading>
          <p className="text-gray-600 max-w-2xl">{t('villages_page_intro')}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/map" className="underline">
              {t('villages_view_map')}
            </Link>
            <Link href="/villages/create" className="underline">
              {t('villages_add_cta')}
            </Link>
          </div>
        </div>
        {isLoading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-600">{t('villages_empty')}</p>
        ) : (
          <div className="flex flex-col">
            {projects.map((project) => (
              <LandProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default VillagesPage;
