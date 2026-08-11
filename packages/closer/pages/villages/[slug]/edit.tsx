import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import VillageForm from '../../../components/VillageForm';
import { Heading, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../../contexts/auth';
import {
  CreateVillageInput,
  Village,
} from '../../../types/village';
import {
  canManageVillage,
  getVillage,
  updateVillage,
} from '../../../utils/village.utils';
import Page401 from '../../401';
import PageNotFound from '../../not-found';

const EditVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;
    const load = async () => {
      const result = await getVillage(slug);
      if (!cancelled) {
        setProject(result);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!isAuthenticated) return <Page401 />;

  if (isLoading) {
    return (
      <div className="main-content py-12">
        <Spinner />
      </div>
    );
  }

  if (!project) {
    return <PageNotFound error={t('villages_not_found')} />;
  }

  const isAdmin = user?.roles?.includes('admin');
  if (!canManageVillage(project, user?._id) && !isAdmin) {
    return <Page401 />;
  }

  const handleSubmit = async (payload: CreateVillageInput) => {
    await updateVillage(project._id, payload as Partial<Village>);
    router.push(`/villages/${project.slug || project._id}`);
  };

  return (
    <>
      <Head>
        <title>
          {t('villages_edit_title')} — {project.name}
        </title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8">
        <Heading level={1}>{t('villages_edit_title')}</Heading>
        <VillageForm
          initial={project}
          submitLabel={t('villages_edit_submit')}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

export default EditVillagePage;
