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
import { Checkbox, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { Lead } from '../../types/lead';
import { CreateVillageInput, Village } from '../../types/village';
import { fetchLead } from '../../utils/leads.utils';
import { canReviewVillage, createVillage } from '../../utils/village.utils';
import {
  applicationToVillage,
  fetchApplication,
  leadToVillage,
} from '../../utils/villageApplication.utils';

const queryValue = (value: string | string[] | undefined) =>
  typeof value === 'string' && value ? value : undefined;

const CreateVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Reached from the applications dashboard or the leads board: the listing
  // opens pre-filled with whatever the applicant already told us, and the
  // created village points back at the application it came from. A lead adds
  // the person as project manager and its match criteria to the checklist.
  const queryApplicationId = queryValue(router.query.applicationId);
  const leadIdParam = queryValue(router.query.lead);
  // The board drafts villages so the brief and the questionnaire have
  // somewhere to land before anyone decides to list them; `draft=1` says so.
  const startsAsDraft = queryValue(router.query.draft) === '1';
  const [initial, setInitial] = useState<Partial<Village> | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isDraft, setIsDraft] = useState(startsAsDraft);
  // `VillageForm` reads `initial` once, at mount, so the form must not render
  // until the application (and the lead) has been fetched.
  const [isLoadingApplication, setIsLoadingApplication] = useState(
    Boolean(queryApplicationId || leadIdParam),
  );
  const [applicationError, setApplicationError] = useState<string | null>(null);

  useEffect(() => {
    setIsDraft(startsAsDraft);
  }, [startsAsDraft]);

  useEffect(() => {
    if (!queryApplicationId && !leadIdParam) {
      setIsLoadingApplication(false);
      return;
    }
    let isCurrent = true;
    setIsLoadingApplication(true);
    const load = async () => {
      const linkedLead = leadIdParam ? await fetchLead(leadIdParam) : null;
      // The lead knows which application it came from when the link did not say.
      const applicationId =
        queryApplicationId || linkedLead?.applications?.[0]?._id;
      const application = applicationId
        ? await fetchApplication(String(applicationId))
        : null;
      if (!isCurrent) return;
      setLead(linkedLead);
      const fromApplication = application
        ? applicationToVillage(application)
        : // The village is still worth creating by hand, so link it to the
          // application anyway rather than blocking on the failed fetch.
          applicationId
          ? { applicationId: String(applicationId) }
          : {};
      const fromLead = linkedLead ? leadToVillage(linkedLead) : {};
      setInitial({
        ...fromLead,
        ...fromApplication,
        criteria: { ...(fromLead.criteria || {}), ...(fromApplication.criteria || {}) },
        projectManager: {
          ...(fromLead.projectManager || {}),
          ...(fromApplication.projectManager || {}),
        },
      });
      if (applicationId && !application) {
        setApplicationError(t('villages_create_application_error'));
      }
      setIsLoadingApplication(false);
    };
    void load();
    return () => {
      isCurrent = false;
    };
  }, [queryApplicationId, leadIdParam, t]);

  const isReviewer = canReviewVillage(user?.roles);
  const canCreate =
    isAuthenticated && (Boolean(user?.affiliate) || isReviewer);

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
          <div className="rounded-[22px] border border-accent-medium bg-background p-8 md:p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-accent-light text-accent-text text-2xl flex items-center justify-center mx-auto">
              ✦
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mt-6">
              {t('villages_gate_title')}
            </h1>
            <p className="text-[15px] text-foreground/70 mt-4 max-w-md mx-auto leading-relaxed">
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
    const applicationId = initial?.applicationId || queryApplicationId;
    // The creator manages the record; the lead's owners come along so the
    // assigned ambassador can read a draft that is private to its people.
    const managedBy = Array.from(
      new Set(
        [user?._id, ...(initial?.managedBy || [])].filter(
          (id): id is string => Boolean(id),
        ),
      ),
    );
    const created = await createVillage({
      ...payload,
      ...(applicationId ? { applicationId } : {}),
      referredBy: user?._id,
      ambassadorId: user?._id,
      managedBy,
      ...(isReviewer && isDraft ? { visibility: 'private' } : {}),
    });
    const path = created.slug || created._id;
    const back = lead ? `&lead=${encodeURIComponent(lead._id)}` : '';
    router.push(`/villages/${path}?created=1${back}`);
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
          <p className="text-[17px] text-foreground/70 mt-4 leading-relaxed">
            {t('villages_create_intro')}
          </p>
        </header>
        {applicationError && (
          <p className="text-[14.5px] text-failure mb-6" role="alert">
            {applicationError}
          </p>
        )}
        {isLoadingApplication ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {isReviewer ? (
              <div className="rounded-[22px] border border-accent-medium bg-background px-6 py-4 mb-8">
                <Checkbox
                  id="village-create-draft"
                  className="mb-0"
                  isChecked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                >
                  <span className="flex flex-col text-[15px] font-normal text-foreground">
                    <span>{t('villages_create_draft_label')}</span>
                    <span className="text-[13px] text-foreground/60">
                      {t('villages_create_draft_hint')}
                    </span>
                  </span>
                </Checkbox>
              </div>
            ) : null}
            <VillageForm
              initial={initial || undefined}
              submitLabel={
                isReviewer && isDraft
                  ? t('villages_create_submit_draft')
                  : t('villages_create_submit')
              }
              onSubmit={handleSubmit}
              isReviewer={isReviewer}
            />
          </>
        )}
      </PageShell>
    </>
  );
};

export default CreateVillagePage;
