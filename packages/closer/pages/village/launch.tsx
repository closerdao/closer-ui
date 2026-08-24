import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { ReactNode, useEffect, useState } from 'react';

import FeatureNotEnabled from '../../components/FeatureNotEnabled';
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
import { useAuth } from '../../contexts/auth';
import { CreateVillageInput, Village } from '../../types/village';
import {
  clearApplicationAnswers,
  readApplicationAnswers,
  storedApplicationToVillageInitial,
} from '../../utils/applicationAnswersStorage';
import { isSubscriptionActive } from '../../utils/subscriptions.helpers';
import { createVillage, fetchVillageCreatedBy } from '../../utils/village.utils';

const GateCard = ({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) => (
  <div className="rounded-[22px] border border-[#C2F0DA] bg-white p-8 md:p-12 text-center">
    <div className="w-14 h-14 rounded-full bg-[#E2FAEE] text-[#0FA968] text-2xl flex items-center justify-center mx-auto">
      ✦
    </div>
    <h1 className="font-serif text-3xl md:text-4xl mt-6">{title}</h1>
    <p className="text-[15px] text-[#5C6E64] mt-4 max-w-md mx-auto leading-relaxed">
      {body}
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
      {children}
    </div>
  </div>
);

/**
 * Where a subscribed member launches their own village. One per member — a
 * second visit lands on their existing village — and the form opens pre-filled
 * with whatever they told us in the "apply to join" modal, which
 * `ApplicationModal` leaves in localStorage for exactly this moment.
 */
const LaunchVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasActiveSubscription = isSubscriptionActive(user?.subscription);

  const [initial, setInitial] = useState<Partial<Village> | null>(null);
  const [applicationId, setApplicationId] = useState<string | undefined>();
  const [hasPrefill, setHasPrefill] = useState(false);
  const [existingVillage, setExistingVillage] = useState<Village | null>(null);
  // Covers both the localStorage read (kept off the server render so hydration
  // sees the same empty form) and the one-village-per-member lookup.
  const [isPreparing, setIsPreparing] = useState(true);

  useEffect(() => {
    if (!user?._id || !hasActiveSubscription) return;
    let isCurrent = true;
    setIsPreparing(true);
    fetchVillageCreatedBy(user._id).then((village) => {
      if (!isCurrent) return;
      setExistingVillage(village);
      if (!village) {
        const stored = readApplicationAnswers();
        if (stored) {
          setInitial({
            ...storedApplicationToVillageInitial(stored),
            // The launcher is an active subscriber, so their village starts at
            // the stage the deploy CTA unlocks from.
            onboardingStatus: 'subscribed',
          });
          setApplicationId(stored._id);
          setHasPrefill(true);
        } else {
          setInitial({ onboardingStatus: 'subscribed' });
        }
      }
      setIsPreparing(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [user?._id, hasActiveSubscription]);

  if (process.env.NEXT_PUBLIC_FEATURE_FEDERATION !== 'true') {
    return <FeatureNotEnabled feature="federation" />;
  }

  if (isLoading) {
    return (
      <div className="bg-[#FCFDFB] min-h-screen flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Page401 />;
  }

  if (!hasActiveSubscription) {
    return (
      <>
        <Head>
          <title>{t('village_launch_title')}</title>
        </Head>
        <PageShell width="narrow">
          <GateCard
            title={t('village_launch_subscription_title')}
            body={t('village_launch_subscription_body')}
          >
            <Link href="/subscriptions" className={btnPrimary}>
              {t('village_launch_subscription_cta')}
            </Link>
            <Link href="/map" className={btnSecondary}>
              {t('ambassadors_cta_map')}
            </Link>
          </GateCard>
        </PageShell>
      </>
    );
  }

  if (existingVillage) {
    const villagePath = `/villages/${existingVillage.slug || existingVillage._id}`;
    return (
      <>
        <Head>
          <title>{t('village_launch_title')}</title>
        </Head>
        <PageShell width="narrow">
          <GateCard
            title={t('village_launch_existing_title')}
            body={t('village_launch_existing_body')}
          >
            <Link href={villagePath} className={btnPrimary}>
              {t('village_launch_existing_cta')}
            </Link>
          </GateCard>
        </PageShell>
      </>
    );
  }

  const handleSubmit = async (payload: CreateVillageInput) => {
    const created = await createVillage({
      ...payload,
      ...(applicationId ? { applicationId } : {}),
      managedBy: user?._id ? [user._id] : [],
    });
    // Their answers have become a village; a later application (or another
    // device) should not resurrect them into a stale pre-fill.
    clearApplicationAnswers();
    const path = created.slug || created._id;
    router.push(`/villages/${path}?created=1`);
  };

  return (
    <>
      <Head>
        <title>{t('village_launch_title')}</title>
      </Head>
      <PageShell>
        <header className="max-w-2xl mb-10">
          <Eyebrow>{t('village_launch_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('village_launch_title')}
          </h1>
          <p className="text-[17px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('village_launch_intro')}
          </p>
          {hasPrefill ? (
            <p className="text-[14.5px] text-[#0B7A4C] mt-3">
              {t('village_launch_prefill_note')}
            </p>
          ) : null}
        </header>
        {isPreparing ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <VillageForm
            initial={initial || undefined}
            submitLabel={t('village_launch_submit')}
            onSubmit={handleSubmit}
          />
        )}
      </PageShell>
    </>
  );
};

export default LaunchVillagePage;
