import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CommunityMap from '../../../components/CommunityMap';
import VillageEvents from '../../../components/VillageEvents';
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

import { VILLAGE_VERIFICATION_BADGES } from '../../../constants/village.constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import {
  Village,
  VillageSocialNetwork,
  VillageVerificationBadge,
} from '../../../types/village';
import {
  canCoordinateVillage,
  canManageVillage,
  canRequestDeploy,
  fetchAmbassadors,
  fetchUsersByIds,
  getVillage,
  inviteVillageOwner,
  requestVillageDeploy,
  updateVillage,
  villageSocialUrl,
  villageToMapItem,
} from '../../../utils/village.utils';
import PageNotFound from '../../not-found';

const SOCIAL_NETWORKS: VillageSocialNetwork[] = [
  'instagram',
  'twitter',
  'facebook',
];

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
  const [ambassadors, setAmbassadors] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState('');
  // The public email is kept behind a click so it is not sitting in the page
  // source for every scraper that walks the map.
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);

  // Derived above the early returns below so the effects that depend on them
  // stay unconditional — hooks cannot sit after a conditional return.
  const isAdmin = Boolean(user?.roles?.includes('admin'));
  const canCoordinate = canCoordinateVillage(village, user?._id, isAdmin);
  const managedByKey = (village?.managedBy || []).join(',');

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

  // Only admins get the assignment picker, so only they need the candidate list.
  useEffect(() => {
    if (!isAdmin) {
      setAmbassadors([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const results = await fetchAmbassadors();
      if (!cancelled) setAmbassadors(results);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  // Keyed on the ids themselves so an assignment refetches the names, while an
  // unrelated re-render does not.
  useEffect(() => {
    if (!canCoordinate || !managedByKey) {
      setCoordinators([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const results = await fetchUsersByIds(managedByKey.split(','));
      if (!cancelled) setCoordinators(results);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [canCoordinate, managedByKey]);

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
  const canDeploy = canRequestDeploy(village, user?._id);
  const isAwaitingDeploy =
    village.onboardingStatus === 'deploy_requested' ||
    village.onboardingStatus === 'deploying';
  const isLive = village.onboardingStatus === 'live';
  const mapItem = villageToMapItem(village);
  const villagePath = `/villages/${village.slug || village._id}`;
  const hasActionPanels = Boolean(isManager || isAdmin);
  // "Closer" and "Live on Closer" are the same claim twice over. Managers keep
  // the status pill only while it still says something the Closer pill doesn't.
  const showStatusPill =
    hasActionPanels && !(village.closer && village.onboardingStatus === 'live');
  const projectManager = village.projectManager;
  const hasContactCard = Boolean(projectManager?.name || projectManager?.email);
  // createdBy is who filed the village (often an ambassador), not who owns it.
  // An owner is only "attached" once their invite address is on the PM card.
  const hasOwner = Boolean(projectManager?.email);
  const contact = village.contact;
  const socialLinks = SOCIAL_NETWORKS.map((network) => ({
    network,
    url: villageSocialUrl(network, contact?.social?.[network]),
  })).filter((link): link is { network: VillageSocialNetwork; url: string } =>
    Boolean(link.url),
  );
  const hasReachCard = Boolean(
    contact?.email || contact?.phone || socialLinks.length,
  );
  // Public visitors see the side cards as a row rather than a column, so the
  // track count has to follow how many cards are actually left after the
  // manager-only ones are dropped — otherwise a lone card sits at a third width.
  const publicSidebarClass = hasContactCard
    ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start'
    : 'grid grid-cols-1 gap-6 items-start';

  const refresh = async () => {
    const result = await getVillage(village.slug || village._id);
    // A failed refetch must not blank out a village we already have.
    if (result) setVillage(result);
  };

  /** Resolves to whether the action went through, so callers can decide
      whether to clear the input that fed it. */
  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setIsActing(true);
      setActionError(null);
      const updated = await action();
      // Adopt the PATCH response straight away so controls that read from
      // `village` — the active verification badge, the coordinator list —
      // settle on the new value instead of waiting on the refetch below.
      if (updated && typeof updated === 'object' && '_id' in updated) {
        setVillage(updated as Village);
      }
      await refresh();
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t('villages_action_error'),
      );
      return false;
    } finally {
      setIsActing(false);
    }
  };

  const handleInviteOwner = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    const succeeded = await runAction(async () => {
      await inviteVillageOwner(village._id, email);
      // Merged rather than replaced: the invite only knows the address, and a
      // bare `{ email }` would drop the name and role already on the card.
      return updateVillage(village._id, {
        projectManager: { ...(village.projectManager || {}), email },
      });
    });
    if (succeeded) setInviteEmail('');
  };

  const handleAssignAmbassador = async () => {
    if (!selectedAmbassador) return;
    const managedBy = Array.from(
      new Set([...(village.managedBy || []), selectedAmbassador]),
    );
    await runAction(() => updateVillage(village._id, { managedBy }));
    setSelectedAmbassador('');
  };

  const handleUnassignCoordinator = async (userId: string) => {
    const managedBy = (village.managedBy || []).filter((id) => id !== userId);
    await runAction(() => updateVillage(village._id, { managedBy }));
  };

  // An ambassador already assigned should not be offered again.
  const assignableAmbassadors = ambassadors.filter(
    (ambassador) => !(village.managedBy || []).includes(ambassador._id),
  );

  const coordinatorName = (coordinator: User) =>
    coordinator.screenname || coordinator.email || coordinator._id;

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
            {showStatusPill ? (
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

          {/* PUBLIC CONTACT — sits with the tags rather than in the sidebar, so
              it reads as part of the village's own introduction. */}
          {hasReachCard ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6">
              {contact?.email ? (
                isEmailRevealed ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px] break-all"
                  >
                    {contact.email}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEmailRevealed(true)}
                    className="text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                  >
                    {t('villages_reach_show_email')}
                  </button>
                )
              ) : null}
              {contact?.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                >
                  {contact.phone}
                </a>
              ) : null}
              {socialLinks.map(({ network, url }) => (
                <a
                  key={network}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                >
                  {t(`villages_social_${network}`)} ↗
                </a>
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

            {/* UPCOMING EVENTS — pulled from the village's own instance. */}
            <VillageEvents apiUrl={village.apiUrl} appUrl={village.appUrl} />

            {/* MANAGER ACTIONS */}
            {isManager ? (
              <Panel
                eyebrow={t('villages_manager_actions')}
                title={
                  isAwaitingDeploy
                    ? t('villages_next_step_waiting_title')
                    : canDeploy
                    ? t('villages_next_step_deploy_title')
                    : isLive
                    ? t('villages_next_step_live_title')
                    : t('villages_next_step_intro_title')
                }
                description={
                  isAwaitingDeploy
                    ? t('villages_deploy_pending')
                    : canDeploy
                    ? t('villages_next_step_deploy_body')
                    : isLive
                    ? t('villages_next_step_live_body')
                    : t('villages_next_step_intro_body')
                }
              >
                <div className="flex flex-wrap gap-3">
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

                {/* OWNER INVITE — only while the village has no owner yet. */}
                {hasOwner ? null : (
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
                )}
              </Panel>
            ) : null}

            {/* COORDINATOR — platform admins and the ambassadors assigned to
                this village. */}
            {canCoordinate ? (
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
                        aria-pressed={isActive}
                        className={
                          isActive ? btnSmallPrimary : `${btnSmall} normal-case`
                        }
                        onClick={() =>
                          runAction(() =>
                            updateVillage(village._id, {
                              verificationBadge:
                                badge as VillageVerificationBadge,
                            }),
                          )
                        }
                      >
                        {t(`village_verification_${badge}`)}
                      </button>
                    );
                  })}
                </div>

                {/* AMBASSADOR ASSIGNMENT — admin only */}
                {isAdmin ? (
                  <div className="mt-7 pt-6 border-t border-[#EEF3F0]">
                    <span className={labelClass}>
                      {t('villages_assign_ambassador')}
                    </span>
                    <p className="text-[13px] text-[#5C6E64] mt-1 mb-3">
                      {t('villages_assign_ambassador_hint')}
                    </p>

                    {coordinators.length > 0 ? (
                      <ul className="flex flex-col gap-2 mb-4">
                        {coordinators.map((coordinator) => (
                          <li
                            key={coordinator._id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-[#E4F3EB] bg-[#F3FCF7] px-3.5 py-2.5"
                          >
                            <span className="text-[13.5px] text-[#10201A] break-all">
                              {coordinator.slug ? (
                                <Link
                                  href={`/ambassadors/${coordinator.slug}`}
                                  className="font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
                                >
                                  {coordinatorName(coordinator)}
                                </Link>
                              ) : (
                                coordinatorName(coordinator)
                              )}
                            </span>
                            <button
                              type="button"
                              className={`${btnSmall} normal-case flex-none`}
                              disabled={isActing}
                              onClick={() =>
                                handleUnassignCoordinator(coordinator._id)
                              }
                            >
                              {t('villages_unassign_ambassador_cta')}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] text-[#9BAAA2] mb-4">
                        {t('villages_assign_ambassador_empty')}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex-1 sm:max-w-xs">
                        <span className="sr-only">
                          {t('villages_assign_ambassador')}
                        </span>
                        <select
                          className={inputClass}
                          value={selectedAmbassador}
                          disabled={isActing}
                          onChange={(event) =>
                            setSelectedAmbassador(event.target.value)
                          }
                        >
                          <option value="">
                            {t('villages_assign_ambassador_placeholder')}
                          </option>
                          {assignableAmbassadors.map((ambassador) => (
                            <option key={ambassador._id} value={ambassador._id}>
                              {coordinatorName(ambassador)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className={btnSmall}
                        disabled={isActing || !selectedAmbassador}
                        onClick={handleAssignAmbassador}
                      >
                        {t('villages_assign_ambassador_cta')}
                      </button>
                    </div>

                    {ambassadors.length === 0 ? (
                      <p className="text-[12.5px] text-[#9BAAA2] mt-3">
                        {t('villages_assign_ambassador_none_available')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {/* The deploy queue itself is an admin dashboard, so only link
                    coordinators who can actually open it. */}
                {isAdmin && isAwaitingDeploy ? (
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
              hasActionPanels ? 'flex flex-col gap-6' : publicSidebarClass
            }
          >
            {/* Onboarding progress and platform pricing are internal to running
                the village — a public visitor sees neither. */}
            {hasActionPanels ? (
              <Panel eyebrow={t('villages_onboarding_title')}>
                <JourneyTracker status={village.onboardingStatus} />
              </Panel>
            ) : null}

            {projectManager && hasContactCard ? (
              <Panel eyebrow={t('villages_contact_title')}>
                <p className="font-serif text-xl text-[#10201A]">
                  {projectManager.name}
                </p>
                {projectManager.role ? (
                  <p className="text-[13px] text-[#5C6E64] mt-1">
                    {projectManager.role}
                  </p>
                ) : null}
                {projectManager.email ? (
                  <a
                    href={`mailto:${projectManager.email}`}
                    className="inline-block mt-3 text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px] break-all"
                  >
                    {projectManager.email}
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
