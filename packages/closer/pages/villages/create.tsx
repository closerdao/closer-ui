import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import VillageForm from '../../components/VillageForm';
import {
  Eyebrow,
  PageShell,
  btnPrimary,
  btnSecondary,
} from '../../components/VillageUI';
import { Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import { CreateVillageInput, Village } from '../../types/village';
import { canReviewVillage, createVillage } from '../../utils/village.utils';
import {
  applicationToVillage,
  fetchApplication,
} from '../../utils/villageApplication.utils';

const CreateVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Reached from the applications dashboard: the listing opens pre-filled with
  // whatever the applicant already told us, and the created village points back
  // at the application it came from.
  const applicationId =
    typeof router.query.applicationId === 'string'
      ? router.query.applicationId
      : undefined;
  const [initial, setInitial] = useState<Partial<Village> | null>(null);
  // `VillageForm` reads `initial` once, at mount, so the form must not render
  // until the application has been fetched.
  const [isLoadingApplication, setIsLoadingApplication] = useState(
    Boolean(applicationId),
  );
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) {
      setIsLoadingApplication(false);
      return;
    }
    let isCurrent = true;
    setIsLoadingApplication(true);
    fetchApplication(applicationId).then((application) => {
      if (!isCurrent) return;
      if (application) {
        setInitial(applicationToVillage(application));
      } else {
        // The village is still worth creating by hand, so link it to the
        // application anyway rather than blocking on the failed fetch.
        setInitial({ applicationId });
        setApplicationError(t('villages_create_application_error'));
      }
      setIsLoadingApplication(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [applicationId, t]);

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
      <>
        <Head>
          <title>{t('villages_create_title')}</title>
        </Head>
        <PageShell width="narrow">
          <div className="rounded-[22px] border border-[#C2F0DA] bg-white p-8 md:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E2FAEE] text-[#0FA968] text-2xl flex items-center justify-center mx-auto">
              ✦
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mt-6">
              {t('villages_gate_title')}
            </h1>
            <p className="text-[15px] text-[#5C6E64] mt-4 max-w-md mx-auto leading-relaxed">
              {t('villages_create_ambassador_required')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/ambassadors" className={btnPrimary}>
                {t('ambassadors_cta_join')}
              </Link>
              <Link href="/map" className={btnSecondary}>
                {t('ambassadors_cta_map')}
              </Link>
            </div>
          </div>
        </PageShell>
      </>
    );
  }

  const handleSubmit = async (payload: CreateVillageInput) => {
    const created = await createVillage({
      ...payload,
      ...(applicationId ? { applicationId } : {}),
      referredBy: user?._id,
      managedBy: user?._id ? [user._id] : [],
    });
    const path = created.slug || created._id;
    router.push(`/villages/${path}?created=1`);
  };

  return (
    <>
      <Head>
        <title>{t('villages_create_title')}</title>
      </Head>
      <PageShell>
        <header className="max-w-2xl mb-10">
          <Eyebrow>{t('villages_create_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('villages_create_title')}
          </h1>
          <p className="text-[17px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('villages_create_intro')}
          </p>
        </header>
        {applicationError && (
          <p className="text-[14.5px] text-[#B4361C] mb-6" role="alert">
            {applicationError}
          </p>
        )}
        {isLoadingApplication ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <VillageForm
            initial={initial || undefined}
            submitLabel={t('villages_create_submit')}
            onSubmit={handleSubmit}
            isReviewer={canReviewVillage(user?.roles)}
          />
        )}
      </PageShell>
    </>
  );
};

export default CreateVillagePage;
