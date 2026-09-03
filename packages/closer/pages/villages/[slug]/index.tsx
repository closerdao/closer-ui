import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import CommunityMap from '../../../components/CommunityMap';
import VillageEvents from '../../../components/VillageEvents';
import {
  CloserPill,
  Eyebrow,
  PageShell,
  Panel,
  Pill,
  VerificationPill,
  VillageAccessPill,
  VillageStatusPill,
  btnPrimary,
  btnSmall,
  btnSmallPrimary,
  inputClass,
  labelClass,
} from '../../../components/VillageUI';
import DeployCTA from '../../../components/VillageUI/DeployCTA';
import { VillageFunnelSteps } from '../../../components/VillageUI/FunnelSteps';
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
  approveVillage,
  canApproveVillage,
  canCoordinateVillage,
  canDeployVillage,
  canManageVillage,
  fetchAmbassadors,
  fetchUsersByIds,
  getVillage,
  getVillageAccessReason,
  inviteVillageOwner,
  isVillageDraft,
  updateVillage,
  villageSocialUrl,
  villageToMapItem,
} from '../../../utils/village.utils';
import {
  VillageQuestion,
  countAnsweredVillageQuestions,
  getVillageQuestions,
} from '../../../utils/villageQuestions';
import PageNotFound from '../../not-found';

const SOCIAL_NETWORKS: VillageSocialNetwork[] = [
  'instagram',
  'twitter',
  'facebook',
];

const VillageDetailPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { slug, created, lead: leadParam } = router.query;
  const { user } = useAuth();
  const [village, setVillage] = useState<Village | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [ambassadors, setAmbassadors] = useState<User[]>([]);
  const [coordinators, setCoordinators] = useState<User[]>([]);
  const [selectedAmbassador, setSelectedAmbassador] = useState('');
  const [questions, setQuestions] = useState<VillageQuestion[]>([]);
  // The public email is kept behind a click so it is not sitting in the page
  // source for every scraper that walks the map.
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);

  // Derived above the early returns below so the effects that depend on them
  // stay unconditional — hooks cannot sit after a conditional return.
  const isAdmin = Boolean(user?.roles?.includes('admin'));
  const canCoordinate = canCoordinateVillage(village, user?._id, isAdmin);
  const managedByKey = (village?.managedBy || []).join(',');
  // The questions route is the authority on who may read them; this only
  // decides whether it is worth asking.
  const canSeeQuestions = canManageVillage(village, user?._id) || isAdmin;

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

  // Only to decide whether to draw the entry point — a viewer sent to an empty
  // "tell us more" form learns nothing. The answers live on that page.
  const villageId = village?._id;
  useEffect(() => {
    if (!villageId || !canSeeQuestions) {
      setQuestions([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const result = await getVillageQuestions(villageId);
        if (!cancelled) setQuestions(result.questions);
      } catch {
        // A 403 here is ordinary: the route is stricter than this guess.
        if (!cancelled) setQuestions([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [villageId, canSeeQuestions]);

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

  const isManager = canManageVillage(village, user?._id);
  // Admin | team | assigned ambassador | founder (createdBy).
  const canDeploy = canDeployVillage(village, user);
  // A draft is off the map until one of its people publishes it. Only they
  // can read it at all, so the banner never shows to a public visitor.
  const isDraft = isVillageDraft(village);
  const canPublish = isDraft && canApproveVillage(village, user);
  const isCreatorConfirming = Boolean(
    user?._id && village.createdBy === user._id && !isAdmin,
  );
  const leadHref =
    typeof leadParam === 'string' && leadParam
      ? `/dashboard/leads/all?lead=${encodeURIComponent(leadParam)}`
      : null;
  // Named on every internal panel so the viewer knows which hat lets them in.
  const accessReason = getVillageAccessReason(village, user);
  const isAwaitingDeploy =
    village.onboardingStatus === 'deploy_requested' ||
    village.onboardingStatus === 'deploying';
  const isLive = village.onboardingStatus === 'live';
  const mapItem = villageToMapItem(village);
  const villagePath = `/villages/${village.slug || village._id}`;
  const hasActionPanels = Boolean(isManager || isAdmin || canDeploy);
  // "Closer" and "Live on Closer" are the same claim twice over. Managers keep
  // the status pill only while it still says something the Closer pill doesn't.
  const showStatusPill =
    hasActionPanels && !(village.closer && village.onboardingStatus === 'live');
  const projectManager = village.projectManager;
  const hasContactCard = Boolean(projectManager?.name || projectManager?.email);
  // createdBy is who filed the village (often an ambassador), not who owns it.
  // An owner is only "attached" once their invite address is on the PM card.
  const hasOwner = Boolean(projectManager?.email);
  // The creator is the owner-in-waiting; there is nobody else to invite.
  const isCreator = Boolean(user?._id && village.createdBy === user._id);
  const canInviteOwner = !hasOwner && !isCreator;
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
  const unansweredCount =
    questions.length - countAnsweredVillageQuestions(questions).answered;
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

  const handlePublish = async () => {
    await runAction(() => approveVillage(village._id));
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
          <div className="mb-8 flex items-start gap-3 rounded-[18px] border border-accent-medium bg-accent-light px-5 py-4 animate-fade-in-up">
            <span className="flex-none w-6 h-6 rounded-full bg-accent text-accent-foreground text-[12px] font-bold flex items-center justify-center">
              ✓
            </span>
            <div>
              <p className="text-[15px] font-semibold text-accent-text">
                {t('villages_created_banner_title')}
              </p>
              <p className="text-[13.5px] text-foreground/70 mt-1">
                {t('villages_created_banner_body')}
              </p>
            </div>
          </div>
        ) : null}

        {isDraft ? (
          <div
            className="rounded-[22px] border border-amber-300 bg-amber-50 px-6 py-5 mb-8 flex flex-col md:flex-row md:items-center gap-4"
            data-testid="village-draft-banner"
          >
            <div className="grow">
              <p className="text-[15px] font-semibold text-amber-900">
                {t('villages_draft_banner_title')}
              </p>
              <p className="text-[13.5px] text-amber-900/80 mt-1">
                {t('villages_draft_banner_body')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {leadHref ? (
                <Link href={leadHref} className={btnSmall}>
                  {t('villages_draft_back_to_lead')}
                </Link>
              ) : null}
              {canPublish ? (
                <button
                  type="button"
                  className={btnSmallPrimary}
                  disabled={isActing}
                  onClick={handlePublish}
                >
                  {isCreatorConfirming
                    ? t('villages_draft_confirm')
                    : t('villages_draft_publish')}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* HERO */}
        <header className="pb-10 border-b border-accent-medium">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {isDraft ? <Pill tone="amber">{t('villages_draft_pill')}</Pill> : null}
            {village.closer ? <CloserPill /> : null}
            <VerificationPill badge={village.verificationBadge} />
            {showStatusPill ? (
              <VillageStatusPill status={village.onboardingStatus} />
            ) : null}
          </div>

          <h1 className="font-serif text-4xl md:text-6xl leading-[1.05]">
            {village.name}
          </h1>
          <p className="text-[12.5px] uppercase tracking-[0.14em] text-foreground/70 mt-3">
            {village.country}
          </p>
          <p className="text-[17px] text-foreground/70 leading-relaxed mt-5 max-w-2xl">
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
                  className="text-[12px] text-foreground/70 bg-accent-light/40 border border-neutral-dark px-3 py-1 rounded-full"
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
                    className="text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px] break-all"
                  >
                    {contact.email}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEmailRevealed(true)}
                    className="text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px]"
                  >
                    {t('villages_reach_show_email')}
                  </button>
                )
              ) : null}
              {contact?.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px]"
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
                  className="text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px]"
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
              <div className="rounded-[22px] overflow-hidden border border-accent-medium">
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

            {/* DEPLOY — the one control that talks to procurement. Read-only
                for anyone who may see the panel but not press the button. */}
            {hasActionPanels ? (
              <DeployCTA
                village={village}
                canDeploy={canDeploy}
                isAdmin={isAdmin}
                accessReason={accessReason}
                onDeployed={(updated) => {
                  if (updated) setVillage(updated);
                  void refresh();
                }}
              />
            ) : null}

            {/* MANAGER ACTIONS — dropped once the village is live: the panel
                only ever names the next step of the onboarding funnel, and a
                live village has none left. The edit link it carried is already
                in the hero, and the owner invite has its own panel below. */}
            {isManager && !isLive ? (
              <Panel
                eyebrow={
                  <span className="flex flex-wrap items-center gap-2">
                    {t('villages_manager_actions')}
                    <VillageAccessPill reason={accessReason} />
                  </span>
                }
                title={
                  isAwaitingDeploy
                    ? t('villages_next_step_waiting_title')
                    : t('villages_next_step_intro_title')
                }
                description={
                  isAwaitingDeploy
                    ? t('villages_deploy_pending')
                    : t('villages_next_step_intro_body')
                }
              >
                <div className="flex flex-wrap gap-3">
                  <Link href={`${villagePath}/edit`} className={btnSmall}>
                    {t('villages_edit_cta')}
                  </Link>
                </div>
              </Panel>
            ) : null}

            {/* OWNER INVITE — only while the village has no owner yet, and
                never for the creator, who is that owner. Stands on its own so
                a live village that still has nobody attached keeps it. */}
            {isManager && canInviteOwner ? (
              <Panel
                eyebrow={t('villages_invite_owner')}
                description={t('villages_invite_owner_hint')}
              >
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
              </Panel>
            ) : null}

            {/* TELL US MORE — the founder's side of lead enrichment. Drawn
                only while something is still unanswered: nobody is sent to an
                empty form, and a village that has answered everything is not
                nagged for more. */}
            {unansweredCount > 0 ? (
              <Panel
                eyebrow={t('villages_questions_eyebrow')}
                title={t('villages_questions_cta_title')}
                description={t('villages_questions_cta_body', {
                  count: unansweredCount,
                })}
              >
                <Link
                  href={`${villagePath}/tell-us-more`}
                  className={btnSmallPrimary}
                >
                  {t('villages_questions_cta')}
                </Link>
              </Panel>
            ) : null}

            {/* COORDINATOR — platform admins and the ambassadors assigned to
                this village. */}
            {canCoordinate ? (
              <Panel
                eyebrow={
                  <span className="flex flex-wrap items-center gap-2">
                    {t('villages_admin_actions')}
                    <VillageAccessPill reason={accessReason} />
                  </span>
                }
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
                  <div className="mt-7 pt-6 border-t border-neutral-dark">
                    <span className={labelClass}>
                      {t('villages_assign_ambassador')}
                    </span>
                    <p className="text-[13px] text-foreground/70 mt-1 mb-3">
                      {t('villages_assign_ambassador_hint')}
                    </p>

                    {coordinators.length > 0 ? (
                      <ul className="flex flex-col gap-2 mb-4">
                        {coordinators.map((coordinator) => (
                          <li
                            key={coordinator._id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-dark bg-accent-light/40 px-3.5 py-2.5"
                          >
                            <span className="text-[13.5px] text-foreground break-all">
                              {coordinator.slug ? (
                                <Link
                                  href={`/ambassadors/${coordinator.slug}`}
                                  className="font-semibold text-accent-text underline underline-offset-[3px]"
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
                      <p className="text-[13px] text-foreground/50 mb-4">
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
                      <p className="text-[12.5px] text-foreground/50 mt-3">
                        {t('villages_assign_ambassador_none_available')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {/* The deploy queue itself is an admin dashboard, so only link
                    coordinators who can actually open it. */}
                {isAdmin &&
                (isAwaitingDeploy || village.onboardingStatus === 'failed') ? (
                  <Link
                    href="/dashboard/deploy-queue"
                    className="inline-block mt-5 text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px]"
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
                {/* The same five steps the applicant saw on the way in — the
                    village existing settles the first four. */}
                <VillageFunnelSteps facts={{ village }} />
              </Panel>
            ) : null}

            {projectManager && hasContactCard ? (
              <Panel eyebrow={t('villages_contact_title')}>
                <p className="font-serif text-xl text-foreground">
                  {projectManager.name}
                </p>
                {projectManager.role ? (
                  <p className="text-[13px] text-foreground/70 mt-1">
                    {projectManager.role}
                  </p>
                ) : null}
                {projectManager.email ? (
                  <a
                    href={`mailto:${projectManager.email}`}
                    className="inline-block mt-3 text-[13.5px] font-semibold text-accent-text underline underline-offset-[3px] break-all"
                  >
                    {projectManager.email}
                  </a>
                ) : null}
              </Panel>
            ) : null}

            <div className="rounded-[22px] bg-foreground text-background p-7">
              <Eyebrow className="!text-accent">
                {t('villages_explore_eyebrow')}
              </Eyebrow>
              <p className="font-serif text-xl text-background mt-2.5 leading-snug">
                {t('villages_explore_title')}
              </p>
              <Link
                href="/map"
                className="inline-block mt-4 text-[13.5px] font-semibold text-accent underline underline-offset-[3px]"
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
