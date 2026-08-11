import Head from 'next/head';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import { Button, Heading, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import { Village } from '../../../types/village';
import {
  fetchVillages,
  updateVillage,
} from '../../../utils/village.utils';
import Page401 from '../../401';

const DeployQueuePage = () => {
  const t = useTranslations();
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Village[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const canAccess =
    isAuthenticated &&
    (user?.roles?.includes('admin') ||
      user?.roles?.includes('affiliate-manager'));

  useEffect(() => {
    if (!canAccess) return;
    let cancelled = false;
    const load = async () => {
      const all = await fetchVillages({ limit: 200 });
      if (cancelled) return;
      setProjects(
        all.filter(
          (project) =>
            project.onboardingStatus === 'deploy_requested' ||
            project.deployRequest?.status === 'requested',
        ),
      );
      setIsLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  if (!isAuthenticated || !canAccess) return <Page401 />;

  const markDeploying = async (project: Village) => {
    setIsActing(true);
    await updateVillage(project._id, {
      onboardingStatus: 'deploying',
      deployRequest: {
        ...(project.deployRequest || {}),
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: user?._id,
      },
    } as Partial<Village>);
    const all = await fetchVillages({ limit: 200 });
    setProjects(
      all.filter(
        (item) =>
          item.onboardingStatus === 'deploy_requested' ||
          item.deployRequest?.status === 'requested',
      ),
    );
    setIsActing(false);
  };

  const markLive = async (project: Village) => {
    setIsActing(true);
    await updateVillage(project._id, {
      onboardingStatus: 'live',
      closer: true,
      deployRequest: {
        ...(project.deployRequest || {}),
        status: 'completed',
        processedAt: new Date().toISOString(),
        processedBy: user?._id,
      },
    } as Partial<Village>);
    const all = await fetchVillages({ limit: 200 });
    setProjects(
      all.filter(
        (item) =>
          item.onboardingStatus === 'deploy_requested' ||
          item.deployRequest?.status === 'requested',
      ),
    );
    setIsActing(false);
  };

  return (
    <>
      <Head>
        <title>{t('deploy_queue_title')}</title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8">
        <Heading level={1}>{t('deploy_queue_title')}</Heading>
        <p className="text-gray-600 max-w-2xl">{t('deploy_queue_intro')}</p>
        {isLoading ? (
          <Spinner />
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-600">{t('deploy_queue_empty')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                className="flex flex-col gap-2 border-b border-gray-200 py-4"
              >
                <Link
                  href={`/villages/${project.slug || project._id}`}
                  className="font-medium underline"
                >
                  {project.name}
                </Link>
                <p className="text-sm text-gray-600">
                  {project.country} · {project.onboardingStatus}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    isEnabled={!isActing}
                    onClick={() => markDeploying(project)}
                  >
                    {t('deploy_queue_mark_deploying')}
                  </Button>
                  <Button
                    isEnabled={!isActing}
                    onClick={() => markLive(project)}
                  >
                    {t('deploy_queue_mark_live')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default DeployQueuePage;
