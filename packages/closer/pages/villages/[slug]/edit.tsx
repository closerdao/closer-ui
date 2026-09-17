import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import VillageForm from '../../../components/VillageForm';
import {
  Eyebrow,
  PageShell,
  VillageAccessPill,
} from '../../../components/VillageUI';
import { Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../../401';
import { useAuth } from '../../../contexts/auth';
import { CreateVillageInput, Village } from '../../../types/village';
import {
  canManageVillage,
  canReviewVillage,
  getVillage,
  getVillageAccessReason,
  updateVillage,
} from '../../../utils/village.utils';
import PageNotFound from '../../not-found';

const EditVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug } = router.query;
  const { user, isAuthenticated } = useAuth();
  const [village, setVillage] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;
    const load = async () => {
      const result = await getVillage(slug);
      if (!cancelled) {
        setVillage(result);
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
      <div className="bg-neutral-light min-h-screen flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!village) {
    return <PageNotFound error={t('villages_not_found')} />;
  }

  const isAdmin = Boolean(user?.roles?.includes('admin'));
  if (!canManageVillage(village, user?._id) && !isAdmin) {
    return <Page401 />;
  }

  const villagePath = `/villages/${village.slug || village._id}`;
  const accessReason = getVillageAccessReason(village, user);

  const handleSubmit = async (payload: CreateVillageInput) => {
    await updateVillage(village._id, payload as Partial<Village>);
    router.push(villagePath);
  };

  return (
    <>
      <Head>
        <title>
          {t('villages_edit_title')} — {village.name}
        </title>
      </Head>
      <PageShell>
        <header className="max-w-2xl mb-10">
          <Link
            href={villagePath}
            className="text-[13.5px] font-semibold text-accent-text hover:underline"
          >
            ← {village.name}
          </Link>
          <Eyebrow className="mt-5">
            <span className="flex flex-wrap items-center gap-2">
              {t('villages_edit_eyebrow')}
              <VillageAccessPill reason={accessReason} />
            </span>
          </Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('villages_edit_title')}
          </h1>
        </header>
        <VillageForm
          initial={village}
          submitLabel={t('villages_edit_submit')}
          onSubmit={handleSubmit}
          isAdmin={isAdmin}
          isReviewer={canReviewVillage(user?.roles)}
        />
      </PageShell>
    </>
  );
};

export default EditVillagePage;
