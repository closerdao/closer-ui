import Head from 'next/head';
import { useRouter } from 'next/router';

import LandProjectForm from '../../components/LandProjectForm';
import { Heading } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/landProject.constants';
import { useAuth } from '../../contexts/auth';
import { CreateLandProjectInput } from '../../types/landProject';
import { createLandProject } from '../../utils/landProject.utils';
import Page401 from '../401';

const CreateVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const canCreate =
    isAuthenticated &&
    (Boolean(user?.affiliate) ||
      user?.roles?.includes(AMBASSADOR_ROLE) ||
      user?.roles?.includes('admin'));

  if (!isAuthenticated) {
    return <Page401 />;
  }

  if (!canCreate) {
    return (
      <div className="main-content py-8 flex flex-col gap-3 max-w-xl">
        <Heading level={1}>{t('villages_create_title')}</Heading>
        <p className="text-gray-700">{t('villages_create_ambassador_required')}</p>
        <button
          type="button"
          className="underline text-left"
          onClick={() => router.push('/ambassadors')}
        >
          {t('ambassadors_cta_join')}
        </button>
      </div>
    );
  }

  const handleSubmit = async (payload: CreateLandProjectInput) => {
    const created = await createLandProject({
      ...payload,
      referredBy: user?._id,
      ambassadorId: user?._id,
      managedBy: user?._id ? [user._id] : [],
    });
    const path = created.slug || created._id;
    router.push(`/villages/${path}`);
  };

  return (
    <>
      <Head>
        <title>{t('villages_create_title')}</title>
      </Head>
      <div className="main-content w-full flex flex-col gap-6 py-8">
        <Heading level={1}>{t('villages_create_title')}</Heading>
        <p className="text-gray-600 max-w-2xl">{t('villages_create_intro')}</p>
        <LandProjectForm
          submitLabel={t('villages_create_submit')}
          onSubmit={handleSubmit}
        />
      </div>
    </>
  );
};

export default CreateVillagePage;
