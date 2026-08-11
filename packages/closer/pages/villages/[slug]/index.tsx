import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CommunityMap from '../../../components/CommunityMap';
import {
  CloserPill,
  Eyebrow,
  JourneyTracker,
  PageShell,
  Panel,
  VerificationPill,
  VillageStatusPill,
  btnPrimary,
  btnSmall,
  btnSmallPrimary,
  inputClass,
  labelClass,
} from '../../../components/VillageUI';
import { ErrorMessage, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import {
  PLATFORM_SETUP_FEE_EUR,
  PLATFORM_SUBSCRIPTION_PRICE_EUR,
  VILLAGE_VERIFICATION_BADGES,
} from '../../../constants/village.constants';
import { useAuth } from '../../../contexts/auth';
import { Village, VillageVerificationBadge } from '../../../types/village';
import {
  canManageVillage,
  canRequestDeploy,
  getVillage,
  markVillageSubscribed,
  requestVillageDeploy,
  updateVillage,
  villageToMapItem,
} from '../../../utils/village.utils';
import PageNotFound from '../../not-found';

const VillageDetailPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug, created } = router.query;
  const { user } = useAuth();
  const [village, setVillage] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!slug || typeof slug !== 'string') return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
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

  if (isLoading) {
    return (
      <div className="bg-[#FCFDFB] min-h-screen flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!village) {
    return <PageNotFound error={t('villages_not_found')} />;
  }

  const isManager = canManageVillage(village, user?._id);
  const isAdmin = user?.roles?.includes('admin');
  const canDeploy = canRequestDeploy(village, user?._id);
  const subscribed =
    village.platformSubscription?.status === 'trialing' ||
    village.platformSubscription?.status === 'active';
  const isAwaitingDeploy =
    village.onboardingStatus === 'deploy_requested' ||
    village.onboardingStatus === 'deploying';
  const mapItem = villageToMapItem(village);
  const villagePath = `/villages/${village.slug || village._id}`;
  const hasActionPanels = Boolean(isManager || isAdmin);

  const refresh = async () => {
    const result = await getVillage(village.slug || village._id);
    setVillage(result);
  };

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setIsActing(true);
      setActionError(null);
      await action();
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
    } finally {
      setIsActing(false);
    }
  };

  const handleInviteOwner = async () => {
    if (!inviteEmail.trim()) return;
    const note = `Owner invite pending for ${inviteEmail.trim()}`;
    const attributes = Array.from(
      new Set([...(village.attributes || []), note]),
    );
    await runAction(() =>
      updateVillage(village._id, { attributes } as Partial<Village>),
    );
    setInviteEmail('');
  };

  return (
    <>
      <Head>
        <title>{village.name}</title>
      </Head>

      <PageShell>
        {created ? (
          <div className="mb-8 flex items-start gap-3 rounded-[18px] border border-[#C2F0DA] bg-[#E2FAEE] px-5 py-4 animate-fade-in-up">
            <span className="flex-none w-6 h-6 rounded-full bg-[#3EE08F] text-[#07351F] text-[12px] font-bold flex items-center justify-center">
              ✓
            </span>
            <div>
              <p className="text-[15px] font-semibold text-[#0B7A4C]">
                {t('villages_created_banner_title')}
              </p>
              <p className="text-[13.5px] text-[#5C6E64] mt-1">
                {t('villages_created_banner_body')}
              </p>
            </div>
          </div>
        ) : null}

        {/* HERO */}
        <header className="pb-10 border-b border-[#C2F0DA]">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {village.closer ? <CloserPill /> : null}
            <VerificationPill badge={village.verificationBadge} />
            {isManager || isAdmin ? (
              <VillageStatusPill status={village.onboardingStatus} />
            ) : null}
          </div>

          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">
            {village.name}
          </h1>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-[#5C6E64] mt-3">
            {village.country}
          </p>
          <p className="text-[17px] text-[#5C6E64] leading-relaxed mt-5 max-w-2xl">
            {village.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            {village.appUrl ? (
              <a
                href={village.appUrl}
                target="_blank"
                rel="noreferrer"
                className={btnPrimary}
              >
                {t('villages_visit_app')}
              </a>
            ) : null}
            {village.website ? (
              <a
                href={village.website}
                target="_blank"
                rel="noreferrer"
                className={btnSmall}
              >
                {t('villages_visit_website')} ↗
              </a>
            ) : null}
            {isManager || isAdmin ? (
              <Link href={`${villagePath}/edit`} className={btnSmall}>
                {t('villages_edit_cta')}
              </Link>
            ) : null}
          </div>

          {village.tags?.length ? (
            <div className="flex flex-wrap gap-1.5 mt-6">
              {village.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-[#5C6E64] bg-[#F3FCF7] border border-[#E4F3EB] px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {/* A public visitor sees no action panels, so the two-column split would
            leave half the page empty — collapse to a single column in that case
            and let the side cards run as a row underneath. */}
        <div
          className={`grid gap-6 pt-10 ${
            hasActionPanels ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          <div
            className={`flex flex-col gap-6 ${
              hasActionPanels ? 'lg:col-span-2' : ''
            }`}
          >
            {/* LOCATION */}
            {mapItem ? (
              <div className="rounded-[22px] overflow-hidden border border-[#C2F0DA]">
                <div className="h-[300px]">
                  <CommunityMap
                    projects={[mapItem]}
                    center={mapItem.coords}
                    zoom={7}
                  />
                </div>
              </div>
            ) : null}

            {/* MANAGER ACTIONS */}
            {isManager ? (
              <Panel
                eyebrow={t('villages_manager_actions')}
                title={
                  isAwaitingDeploy
                    ? t('villages_next_step_waiting_title')
                    : !subscribed
                    ? t('villages_next_step_subscribe_title')
                    : canDeploy
                    ? t('villages_next_step_deploy_title')
                    : t('villages_next_step_live_title')
                }
                description={
                  isAwaitingDeploy
                    ? t('villages_deploy_pending')
                    : !subscribed
                    ? t('villages_next_step_subscribe_body', {
                        price: PLATFORM_SUBSCRIPTION_PRICE_EUR,
                      })
                    : canDeploy
                    ? t('villages_next_step_deploy_body')
                    : t('villages_next_step_live_body')
                }
              >
                <div className="flex flex-wrap gap-3">
                  {!subscribed ? (
                    <button
                      type="button"
                      className={btnPrimary}
                      disabled={isActing}
                      onClick={() =>
                        runAction(() => markVillageSubscribed(village._id))
                      }
                    >
                      {t('villages_subscribe_cta')}
                    </button>
                  ) : null}
                  {canDeploy ? (
                    <button
                      type="button"
                      className={btnPrimary}
                      disabled={isActing}
                      onClick={() =>
                        runAction(() => requestVillageDeploy(village._id))
                      }
                    >
                      {t('villages_request_deploy_cta')}
                    </button>
                  ) : null}
                  <Link href={`${villagePath}/edit`} className={btnSmall}>
                    {t('villages_edit_cta')}
                  </Link>
                </div>

                {/* OWNER INVITE */}
                <div className="mt-7 pt-6 border-t border-[#EEF3F0]">
                  <span className={labelClass}>
                    {t('villages_invite_owner')}
                  </span>
                  <p className="text-[13px] text-[#5C6E64] mt-1 mb-3">
                    {t('villages_invite_owner_hint')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      className={`${inputClass} sm:max-w-xs`}
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="owner@example.com"
                    />
                    <button
                      type="button"
                      className={btnSmall}
                      disabled={isActing || !inviteEmail.trim()}
                      onClick={handleInviteOwner}
                    >
                      {t('villages_invite_submit')}
                    </button>
                  </div>
                </div>
              </Panel>
            ) : null}

            {/* ADMIN */}
            {isAdmin ? (
              <Panel
                eyebrow={t('villages_admin_actions')}
                title={t('villages_admin_verification_title')}
                description={t('villages_admin_verification_body')}
              >
                <div className="flex flex-wrap gap-2">
                  {VILLAGE_VERIFICATION_BADGES.map((badge) => {
                    const isActive =
                      (village.verificationBadge || 'unverified') === badge;
                    return (
                      <button
                        key={badge}
                        type="button"
                        disabled={isActing}
                        className={
                          isActive ? btnSmallPrimary : `${btnSmall} normal-case`
                        }
                        onClick={() =>
                          runAction(() =>
                            updateVillage(village._id, {
                              verificationBadge:
                                badge as VillageVerificationBadge,
                            } as Partial<Village>),
                          )
                        }
                      >
                        {t(`village_verification_${badge}`)}
                      </button>
                    );
                  })}
                </div>
                {isAwaitingDeploy ? (
                  <Link
                    href="/dashboard/deploy-queue"
                    className="inline-block mt-5 text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                  >
                    {t('villages_admin_deploy_queue_hint')} →
                  </Link>
                ) : null}
              </Panel>
            ) : null}

            {actionError ? <ErrorMessage error={actionError} /> : null}
          </div>

          {/* SIDEBAR */}
          <aside
            className={
              hasActionPanels
                ? 'flex flex-col gap-6'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start'
            }
          >
            <Panel eyebrow={t('villages_onboarding_title')}>
              <JourneyTracker status={village.onboardingStatus} />
              <div className="mt-7 pt-6 border-t border-[#EEF3F0] flex flex-col gap-3">
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[13.5px] text-[#5C6E64]">
                    {t('villages_pricing_setup')}
                  </span>
                  <span className="font-serif text-2xl text-[#0FA968]">
                    €{PLATFORM_SETUP_FEE_EUR}
                  </span>
                </div>
                <div className="flex justify-between items-baseline gap-4">
                  <span className="text-[13.5px] text-[#5C6E64]">
                    {t('villages_pricing_monthly')}
                  </span>
                  <span className="font-serif text-2xl text-[#0FA968]">
                    €{PLATFORM_SUBSCRIPTION_PRICE_EUR}
                  </span>
                </div>
                <p className="text-[12.5px] text-[#5C6E64] leading-relaxed mt-1">
                  {t('villages_pricing_note')}
                </p>
              </div>
            </Panel>

            {village.projectManager?.name || village.projectManager?.email ? (
              <Panel eyebrow={t('villages_contact_title')}>
                <p className="font-serif text-xl text-[#10201A]">
                  {village.projectManager.name}
                </p>
                {village.projectManager.role ? (
                  <p className="text-[13px] text-[#5C6E64] mt-1">
                    {village.projectManager.role}
                  </p>
                ) : null}
                {village.projectManager.email ? (
                  <a
                    href={`mailto:${village.projectManager.email}`}
                    className="inline-block mt-3 text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px] break-all"
                  >
                    {village.projectManager.email}
                  </a>
                ) : null}
              </Panel>
            ) : null}

            <div className="rounded-[22px] bg-[#0E1E16] text-[#EAF4EE] p-7">
              <Eyebrow className="!text-[#3EE08F]">
                {t('villages_explore_eyebrow')}
              </Eyebrow>
              <p className="font-serif text-xl text-white mt-2.5 leading-snug">
                {t('villages_explore_title')}
              </p>
              <Link
                href="/map"
                className="inline-block mt-4 text-[13.5px] font-semibold text-[#3EE08F] underline underline-offset-[3px]"
              >
                {t('ambassadors_cta_map')} →
              </Link>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
};

export default VillageDetailPage;
