import Link from 'next/link';

import { FC, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Village } from '../../types/village';
import {
  CLOSER_DEPLOY_DOMAIN,
  DeployVillageError,
  DeployVillageResult,
  UpdateVillageInput,
  VillageAccessReason,
  VillageLifecycleAction,
  deployVillage,
  getDeployReadiness,
  isValidVillageSubdomain,
  isVillageSlugFrozen,
  isVillageSubdomainTaken,
  normalizeVillageSubdomain,
  reactivateVillage,
  resetVillageDeploy,
  resolveFounderEmail,
  retireVillage,
  sanitizeVillageSubdomainInput,
  suggestVillageSubdomain,
  suspendVillage,
  updateVillage,
} from '../../utils/village.utils';
import Modal from '../Modal';
import { Spinner } from '../ui';
import {
  Eyebrow,
  Pill,
  VillageAccessPill,
  VillageStatusPill,
  btnPrimary,
  btnSmall,
  inputClass,
  labelClass,
} from './index';

/**
 * The one deploy control on a village page. Pressing it calls
 * `POST /village/:id/deploy`; every later state (deploying, failed, live,
 * suspended) is whatever procurement wrote back onto the Village.
 *
 * The route reads the slug and founder email off the village itself, so the
 * pressable states carry a small review form for both — the address until the
 * slug freezes, the email always — and anything changed there is PATCHed onto
 * the village before the deploy is asked for.
 *
 * Whether the viewer may press it is the caller's call (`canDeployVillage`) and
 * arrives as `canDeploy`. Everyone who can see the manager panel sees the card
 * — founders included — because "where is my village?" is the question it
 * answers, not just "shall I deploy it?".
 */
export type DeployCTAState =
  | 'not_ready'
  | 'ready'
  | 'in_progress'
  | 'live'
  | 'unmanaged_live'
  | 'suspended'
  | 'retired'
  | 'failed';

export const getDeployCTAState = (village: Village): DeployCTAState => {
  const status = village.onboardingStatus;
  if (status === 'deploy_requested' || status === 'deploying') {
    return 'in_progress';
  }
  if (status === 'failed') return 'failed';
  if (status === 'suspended') return 'suspended';
  if (status === 'retired') return 'retired';
  if (status === 'live') {
    // Live but not procurement's = an admin typed the URLs by hand (TDF-style).
    return village.managed ? 'live' : 'unmanaged_live';
  }
  return getDeployReadiness(village).ready ? 'ready' : 'not_ready';
};

export const formatDeployDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Deliberately loose — the API stays the authority; this only catches typos. */
const EMAIL_SHAPE = /^\S+@\S+\.\S+$/;

export const requestedByName = (village: Village) => {
  const who = village.deployRequest?.requestedBy;
  if (!who) return null;
  if (typeof who === 'string') return who;
  return who.screenname || who.email || who._id || null;
};

const ExternalLink: FC<{ href: string; label: string; primary?: boolean }> = ({
  href,
  label,
  primary,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={primary ? btnPrimary : btnSmall}
  >
    {label} ↗
  </a>
);

export const DeployCTA: FC<{
  village: Village;
  /** False renders every state read-only — no button, no retry. */
  canDeploy?: boolean;
  /** Admins keep a pressable deploy button in every state — live and
      suspended included — so they can always re-run procurement. */
  isAdmin?: boolean;
  /** Admin | team (ADR 0023 §3) — gates Suspend/Reactivate/Retire, which are
      narrower than `canDeploy`: a village's own ambassador or founder never
      sees these. */
  canManageLifecycle?: boolean;
  /** Why the viewer sees this card at all — named on the card. */
  accessReason?: VillageAccessReason | null;
  /** Called with the village the route returned (202) so the page can adopt it. */
  /** Village is omitted when the response carried none — refetch instead. */
  onDeployed?: (village?: Village) => void;
  /** Injectable so tests can drive the route without a backend. */
  deploy?: (id: string) => Promise<DeployVillageResult>;
  /** Injectable: the pre-deploy PATCH that records reviewed slug/email edits. */
  save?: (id: string, payload: UpdateVillageInput) => Promise<Village>;
  /** Injectable: the directory lookup guarding against a duplicate address. */
  isSubdomainTaken?: (subdomain: string, excludeId?: string) => Promise<boolean>;
  /** Injectable so tests can drive the lifecycle routes without a backend. */
  suspend?: (id: string) => Promise<DeployVillageResult>;
  reactivate?: (id: string) => Promise<DeployVillageResult>;
  retire?: (id: string, confirmSlug: string) => Promise<DeployVillageResult>;
  /** Injectable so tests can drive the reset route without a backend. */
  resetDeploy?: (id: string) => Promise<Village>;
  className?: string;
}> = ({
  village,
  canDeploy = false,
  isAdmin = false,
  canManageLifecycle = false,
  accessReason = null,
  onDeployed,
  deploy = deployVillage,
  save = updateVillage,
  isSubdomainTaken = isVillageSubdomainTaken,
  suspend = suspendVillage,
  reactivate = reactivateVillage,
  retire = retireVillage,
  resetDeploy = resetVillageDeploy,
  className = '',
}) => {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<DeployVillageError | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lifecycleConfirm, setLifecycleConfirm] = useState<
    'suspend' | 'reactivate' | null
  >(null);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [retireSlugInput, setRetireSlugInput] = useState('');
  const [retireFieldError, setRetireFieldError] = useState<string | null>(
    null,
  );
  const [isLifecycleSubmitting, setIsLifecycleSubmitting] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<DeployVillageError | null>(
    null,
  );
  const [lifecyclePending, setLifecyclePending] =
    useState<VillageLifecycleAction | null>(null);
  const [lifecycleWarning, setLifecycleWarning] = useState<string | null>(
    null,
  );
  const [isResetConfirming, setIsResetConfirming] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<DeployVillageError | null>(
    null,
  );

  // The "waiting for procurement" note lives until procurement's write-back
  // flips the status and the parent's refetch hands us the new village. The
  // page reuses this element (no key), so clear on status change here rather
  // than relying on a remount.
  useEffect(() => {
    setLifecyclePending(null);
    setLifecycleWarning(null);
  }, [village.onboardingStatus]);

  const slugFrozen = isVillageSlugFrozen(village);
  const [subdomain, setSubdomain] = useState(() =>
    suggestVillageSubdomain(village),
  );
  const [ownerEmail, setOwnerEmail] = useState(
    () => resolveFounderEmail(village) || '',
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const state = getDeployCTAState(village);
  const readiness = getDeployReadiness(village);
  const requestedAt = formatDeployDate(village.deployRequest?.requestedAt);
  const requestedBy = requestedByName(village);
  const editPath = `/villages/${village.slug || village._id}/edit`;
  const canAct = canDeploy || isAdmin;

  const handleDeploy = async () => {
    setError(null);
    setWarning(null);
    setFieldError(null);

    const slug = normalizeVillageSubdomain(subdomain);
    const email = ownerEmail.trim();
    if (!slugFrozen && !isValidVillageSubdomain(slug)) {
      setFieldError(t('villages_deploy_modal_error_invalid'));
      return;
    }
    if (email && !EMAIL_SHAPE.test(email)) {
      setFieldError(t('villages_deploy_review_email_invalid'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Record what the reviewer changed before asking for the deploy — the
      // route reads the slug and founder email off the village, not off the
      // request.
      const patch: UpdateVillageInput = {};
      if (!slugFrozen && slug !== village.slug) {
        if (await isSubdomainTaken(slug, village._id)) {
          setFieldError(t('villages_deploy_modal_error_taken'));
          return;
        }
        patch.slug = slug;
      }
      if (email !== (resolveFounderEmail(village) || '')) {
        // Written to the field the route resolves first for this village, so
        // the reviewed address is the one that wins.
        if (village.projectManager?.email) {
          patch.projectManager = { ...village.projectManager, email };
        } else {
          patch.contact = { ...village.contact, email };
        }
      }
      if (Object.keys(patch).length > 0) {
        await save(village._id, patch);
      }

      const result = await deploy(village._id);
      // A 202 with a warning still recorded the request — procurement just did
      // not answer. It may come back without a village, so pass through what
      // there is and let the page refetch rather than adopting a non-village.
      setWarning(result.warning || null);
      onDeployed?.(result.village);
    } catch (err) {
      setError(
        err instanceof DeployVillageError
          ? err
          : new DeployVillageError(
              err instanceof Error ? err.message : t('villages_action_error'),
              0,
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared by suspend/reactivate/retire: none of the three change
  // `onboardingStatus` themselves (procurement's write-back does), so a
  // clean 202 only earns an amber "waiting for procurement" note, not a
  // state flip — the caller's refetch is what eventually shows the real one.
  const runLifecycleAction = async (
    action: VillageLifecycleAction,
    call: () => Promise<DeployVillageResult>,
  ) => {
    setLifecycleError(null);
    try {
      setIsLifecycleSubmitting(true);
      const result = await call();
      setLifecyclePending(action);
      setLifecycleWarning(result.warning || null);
      setLifecycleConfirm(null);
      setIsRetireModalOpen(false);
      setRetireSlugInput('');
      onDeployed?.(result.village);
    } catch (err) {
      setLifecycleError(
        err instanceof DeployVillageError
          ? err
          : new DeployVillageError(
              err instanceof Error ? err.message : t('villages_action_error'),
              0,
            ),
      );
    } finally {
      setIsLifecycleSubmitting(false);
    }
  };

  const handleSuspend = () =>
    runLifecycleAction('suspend', () => suspend(village._id));
  const handleReactivate = () =>
    runLifecycleAction('reactivate', () => reactivate(village._id));
  const handleRetireSubmit = () => {
    const slug = retireSlugInput.trim();
    if (slug !== village.slug) {
      setRetireFieldError(t('villages_lifecycle_retire_modal_error_mismatch'));
      return;
    }
    setRetireFieldError(null);
    void runLifecycleAction('retire', () => retire(village._id, slug));
  };

  // Inline confirm for suspend/reactivate — a state's actions never carry
  // both, so there is never a second inline confirm to collide with.
  const lifecycleActionBlock = (
    action: 'suspend' | 'reactivate',
    ctaKey: string,
    confirmBodyKey: string,
    confirmCtaKey: string,
    onConfirm: () => void,
  ) => {
    if (lifecycleConfirm === action) {
      return (
        <div className="flex flex-col gap-2" key={action}>
          <p className="text-[13.5px] text-foreground/70 leading-relaxed">
            {t(confirmBodyKey)}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={btnSmall}
              disabled={isLifecycleSubmitting}
              onClick={onConfirm}
            >
              {isLifecycleSubmitting ? <Spinner /> : null}
              {t(confirmCtaKey)}
            </button>
            <button
              type="button"
              className={btnSmall}
              disabled={isLifecycleSubmitting}
              onClick={() => setLifecycleConfirm(null)}
            >
              {t('villages_lifecycle_cancel_cta')}
            </button>
          </div>
        </div>
      );
    }
    return (
      <button
        type="button"
        className={btnSmall}
        key={action}
        onClick={() => {
          setLifecycleError(null);
          setLifecycleConfirm(action);
        }}
      >
        {t(ctaKey)}
      </button>
    );
  };

  const retireTriggerButton = (
    <button
      type="button"
      className={btnSmall}
      onClick={() => {
        setLifecycleError(null);
        setRetireSlugInput('');
        setRetireFieldError(null);
        setIsRetireModalOpen(true);
      }}
    >
      {t('villages_lifecycle_retire_cta')}
    </button>
  );

  /**
   * `live` (managed only) offers Suspend + Retire; `suspended` offers
   * Reactivate + Retire. An unmanaged live village never reaches this — its
   * state is `unmanaged_live`, not `live` — so it gets none of the three
   * without any extra check here.
   */
  const lifecycleControls = (actions: Array<'suspend' | 'reactivate' | 'retire'>) => {
    if (!canManageLifecycle) return null;
    return (
      <div className="mt-5 pt-5 border-t border-accent-medium/60 flex flex-wrap gap-3">
        {actions.includes('suspend')
          ? lifecycleActionBlock(
              'suspend',
              'villages_lifecycle_suspend_cta',
              'villages_lifecycle_suspend_confirm_body',
              'villages_lifecycle_suspend_confirm_cta',
              handleSuspend,
            )
          : null}
        {actions.includes('reactivate')
          ? lifecycleActionBlock(
              'reactivate',
              'villages_lifecycle_reactivate_cta',
              'villages_lifecycle_reactivate_confirm_body',
              'villages_lifecycle_reactivate_confirm_cta',
              handleReactivate,
            )
          : null}
        {actions.includes('retire') ? retireTriggerButton : null}
      </div>
    );
  };

  const handleResetDeploy = async () => {
    setResetError(null);
    try {
      setIsResetting(true);
      const updated = await resetDeploy(village._id);
      setIsResetConfirming(false);
      onDeployed?.(updated);
    } catch (err) {
      setResetError(
        err instanceof DeployVillageError
          ? err
          : new DeployVillageError(
              err instanceof Error ? err.message : t('villages_action_error'),
              0,
            ),
      );
    } finally {
      setIsResetting(false);
    }
  };

  // Only for a village procurement never actually took over — resetting a
  // managed one would just be overwritten by the reconciler within a minute,
  // and the route itself refuses it (409).
  const canResetDeploy =
    isAdmin &&
    village.managed !== true &&
    (state === 'in_progress' || state === 'failed');

  const resetDeployBlock = canResetDeploy ? (
    <div className="mt-5 pt-5 border-t border-accent-medium/60">
      {isResetConfirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-[13.5px] text-foreground/70 leading-relaxed">
            {t('villages_deploy_reset_confirm_body')}
          </p>
          {resetError ? (
            <p role="alert" className="text-[13px] text-error">
              {resetError.message || t('villages_deploy_error_generic')}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={btnSmall}
              disabled={isResetting}
              onClick={handleResetDeploy}
            >
              {isResetting ? <Spinner /> : null}
              {t('villages_deploy_reset_confirm_cta')}
            </button>
            <button
              type="button"
              className={btnSmall}
              disabled={isResetting}
              onClick={() => {
                setIsResetConfirming(false);
                setResetError(null);
              }}
            >
              {t('villages_deploy_reset_cancel_cta')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 items-start">
          <p className="text-[12.5px] text-foreground/50 leading-relaxed">
            {t('villages_deploy_reset_hint')}
          </p>
          <button
            type="button"
            className={btnSmall}
            onClick={() => setIsResetConfirming(true)}
          >
            {t('villages_deploy_reset_cta')}
          </button>
        </div>
      )}
    </div>
  ) : null;

  // A bare 409 is the route's own double-press guard; procurement's own
  // conflicts arrive as a 4xx carrying their message and code, which wins.
  const isBareConflict =
    error?.status === 409 && (!error.code || error.code === 'CONFLICT');
  const errorCopy = error
    ? isBareConflict
      ? t('villages_deploy_error_conflict')
      : error.message || t('villages_deploy_error_generic')
    : null;

  const deployButton = (label: string) =>
    canAct ? (
      <button
        type="button"
        className={btnPrimary}
        disabled={isSubmitting || (!slugFrozen && !subdomain.trim())}
        onClick={handleDeploy}
      >
        {isSubmitting ? <Spinner /> : null}
        {label}
      </button>
    ) : null;

  // What gets reviewed before the button: the address (until the slug freezes,
  // after which it is only stated) and the founder email the invite goes to.
  const reviewForm = (
    <div className="mt-5 flex flex-col gap-4 max-w-md">
      {!slugFrozen ? (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor="deploy-review-subdomain">
            {t('villages_deploy_modal_slug_label')}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="deploy-review-subdomain"
              className={inputClass}
              value={subdomain}
              onChange={(event) => {
                setSubdomain(sanitizeVillageSubdomainInput(event.target.value));
                setFieldError(null);
              }}
              placeholder={t('villages_deploy_modal_slug_placeholder')}
            />
            <span className="text-[14.5px] text-foreground/70 flex-none">
              .{CLOSER_DEPLOY_DOMAIN}
            </span>
          </div>
          <p className="text-[12.5px] text-foreground/50 font-mono">
            {t('villages_deploy_slug_will_be', {
              slug: normalizeVillageSubdomain(subdomain) || '—',
            })}
          </p>
        </div>
      ) : (
        <p className="text-[12.5px] text-foreground/50 font-mono">
          {t('villages_deploy_slug_will_be', { slug: village.slug || '' })}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor="deploy-review-email">
          {t('villages_deploy_review_email_label')}
        </label>
        <input
          id="deploy-review-email"
          type="email"
          className={inputClass}
          value={ownerEmail}
          onChange={(event) => {
            setOwnerEmail(event.target.value);
            setFieldError(null);
          }}
          placeholder={t('villages_deploy_review_email_placeholder')}
        />
        {/* The route falls back to the creator's account email, which this
            page cannot see — so an empty field is a caveat, not a block. */}
        {!ownerEmail.trim() ? (
          <p className="text-[13px] text-[#8A6314]">
            {t('villages_deploy_missing_email')}
          </p>
        ) : null}
      </div>

      {fieldError ? (
        <p role="alert" className="text-[13px] text-error">
          {fieldError}
        </p>
      ) : null}
    </div>
  );

  return (
    <>
    <section
      className={`bg-background border border-accent-medium rounded-[22px] p-6 md:p-8 ${className}`}
      data-testid="deploy-cta"
      data-deploy-state={state}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <Eyebrow>{t('villages_deploy_eyebrow')}</Eyebrow>
        <span className="flex flex-wrap items-center gap-2">
          <VillageAccessPill reason={accessReason} />
          <VillageStatusPill status={village.onboardingStatus} />
        </span>
      </div>

      {state === 'not_ready' ? (
        <>
          <h2 className="font-serif text-2xl text-foreground leading-tight">
            {t('villages_deploy_not_ready_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {t('villages_deploy_not_ready_body')}
          </p>
          {/* Actors get the address field right here, so the bullet only
              speaks to viewers who cannot set it on this card. */}
          {!canAct && readiness.missingSlug ? (
            <ul className="mt-4 flex flex-col gap-1.5 text-[13.5px] text-[#8A6314]">
              <li>· {t('villages_deploy_missing_slug')}</li>
            </ul>
          ) : null}
          {canAct ? (
            <>
              {reviewForm}
              <div className="flex flex-wrap gap-3 mt-5">
                {deployButton(t('villages_deploy_cta'))}
                <Link href={editPath} className={btnSmall}>
                  {t('villages_edit_cta')}
                </Link>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {state === 'ready' ? (
        <>
          <h2 className="font-serif text-2xl text-foreground leading-tight">
            {canDeploy
              ? t('villages_deploy_ready_title')
              : t('villages_deploy_ready_readonly_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {canDeploy
              ? t('villages_deploy_ready_body')
              : t('villages_deploy_ready_readonly_body')}
          </p>
          {canAct ? (
            <>
              {reviewForm}
              <div className="flex flex-wrap gap-3 mt-5">
                {deployButton(t('villages_deploy_cta'))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-foreground/50 mt-2 font-mono">
                {t('villages_deploy_slug_will_be', {
                  slug: village.slug || '',
                })}
              </p>
              {/* The route falls back to the creator's account email, which
                  this page cannot see — so a missing address is a caveat, not
                  a block. */}
              {readiness.missingEmail ? (
                <p className="text-[13px] text-[#8A6314] mt-3">
                  {t('villages_deploy_missing_email')}
                </p>
              ) : null}
            </>
          )}
        </>
      ) : null}

      {state === 'in_progress' ? (
        <>
          <div className="flex items-center gap-3">
            <Spinner />
            <h2 className="font-serif text-2xl text-foreground leading-tight">
              {t('villages_deploy_in_progress_title')}
            </h2>
          </div>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {t('villages_deploy_in_progress_body')}
          </p>
          {requestedAt ? (
            <p className="text-[12.5px] text-foreground/50 mt-3">
              {requestedBy
                ? t('villages_deploy_requested_by_at', {
                    who: requestedBy,
                    when: requestedAt,
                  })
                : t('villages_deploy_requested_at', { when: requestedAt })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 mt-5">
            <button type="button" className={btnPrimary} disabled>
              {t('villages_deploy_cta')}
            </button>
          </div>
          {resetDeployBlock}
        </>
      ) : null}

      {state === 'live' || state === 'unmanaged_live' ? (
        <>
          <h2 className="font-serif text-2xl text-foreground leading-tight">
            {t('villages_deploy_live_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {state === 'live'
              ? t('villages_deploy_live_body')
              : t('villages_deploy_unmanaged_hint')}
          </p>
          {village.deployedAt ? (
            <p className="text-[12.5px] text-foreground/50 mt-2">
              {t('villages_deploy_live_at', {
                when: formatDeployDate(village.deployedAt) || '',
              })}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 mt-5">
            {village.appUrl ? (
              <ExternalLink
                href={village.appUrl}
                label={t('villages_deploy_open_app')}
                primary
              />
            ) : null}
            {village.apiUrl ? (
              <ExternalLink
                href={village.apiUrl}
                label={t('villages_deploy_open_api')}
              />
            ) : null}
            {isAdmin ? deployButton(t('villages_deploy_redeploy_cta')) : null}
          </div>
          {village.appUrl || village.apiUrl ? (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12.5px] font-mono text-foreground/70 break-all">
              {village.appUrl ? (
                <>
                  <dt className="text-foreground/50">app</dt>
                  <dd>{village.appUrl}</dd>
                </>
              ) : null}
              {village.apiUrl ? (
                <>
                  <dt className="text-foreground/50">api</dt>
                  <dd>{village.apiUrl}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
          {/* Only true `live` (managed) gets lifecycle controls — an
              unmanaged village is admin-typed, and procurement never owned
              it to begin with, so there is nothing here to suspend/retire. */}
          {state === 'live' ? lifecycleControls(['suspend', 'retire']) : null}
        </>
      ) : null}

      {state === 'suspended' ? (
        <>
          <h2 className="font-serif text-2xl text-foreground leading-tight">
            {t('villages_deploy_suspended_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {t('villages_deploy_suspended_body')}
          </p>
          <p className="text-[12.5px] text-foreground/50 mt-2 font-mono">
            {t('villages_deploy_slug_will_be', { slug: village.slug || '' })}
          </p>
          {isAdmin ? (
            <div className="flex flex-wrap gap-3 mt-5">
              {deployButton(t('villages_deploy_redeploy_cta'))}
            </div>
          ) : null}
          {lifecycleControls(['reactivate', 'retire'])}
        </>
      ) : null}

      {state === 'retired' ? (
        <>
          <h2 className="font-serif text-2xl text-foreground leading-tight">
            {t('villages_deploy_retired_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {t('villages_deploy_retired_body')}
          </p>
          {isAdmin ? (
            <div className="flex flex-wrap gap-3 mt-5">
              {deployButton(t('villages_deploy_redeploy_cta'))}
            </div>
          ) : null}
        </>
      ) : null}

      {state === 'failed' ? (
        <>
          <h2 className="font-serif text-2xl text-error leading-tight">
            {t('villages_deploy_failed_title')}
          </h2>
          <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
            {t('villages_deploy_failed_body')}
          </p>
          {village.deployError ? (
            <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-[12.5px] font-mono text-error">
              {village.deployError}
            </pre>
          ) : null}
          {requestedAt ? (
            <p className="text-[12.5px] text-foreground/50 mt-3">
              {requestedBy
                ? t('villages_deploy_requested_by_at', {
                    who: requestedBy,
                    when: requestedAt,
                  })
                : t('villages_deploy_requested_at', { when: requestedAt })}
            </p>
          ) : null}
          {/* The slug is frozen by now, but a wrong or missing founder email
              is a fixable cause — so the review fields return for the retry. */}
          {canAct ? (
            <>
              {reviewForm}
              <div className="flex flex-wrap gap-3 mt-5">
                {deployButton(t('villages_deploy_retry_cta'))}
                <Link href={editPath} className={btnSmall}>
                  {t('villages_edit_cta')}
                </Link>
              </div>
            </>
          ) : null}
          {resetDeployBlock}
        </>
      ) : null}

      {warning ? (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-[#F1DFB8] bg-[#FDF4E3] px-4 py-3"
        >
          <Pill tone="amber" className="flex-none">
            {t('villages_deploy_warning_label')}
          </Pill>
          <div className="text-[13.5px] text-[#8A6314] leading-relaxed">
            <p>{t('villages_deploy_warning_recorded')}</p>
            <p className="text-[11.5px] font-mono mt-1 opacity-80">{warning}</p>
          </div>
        </div>
      ) : null}

      {errorCopy ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3"
        >
          <Pill tone="rose" className="flex-none">
            {error?.status ? `HTTP ${error.status}` : 'error'}
          </Pill>
          <div className="text-[13.5px] text-error leading-relaxed">
            <p>{errorCopy}</p>
            {error?.code ? (
              <p className="text-[11.5px] font-mono mt-1 opacity-70">
                {error.code}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Suspend/reactivate/retire never write the status themselves — this
          stays up until the page's refetch picks up procurement's write-back
          (onDeployed above already triggers one). */}
      {lifecyclePending ? (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-[#F1DFB8] bg-[#FDF4E3] px-4 py-3"
        >
          <Pill tone="amber" className="flex-none">
            {t('villages_deploy_warning_label')}
          </Pill>
          <div className="text-[13.5px] text-[#8A6314] leading-relaxed">
            <p>{t(`villages_lifecycle_pending_${lifecyclePending}`)}</p>
            {lifecycleWarning ? (
              <p className="text-[11.5px] font-mono mt-1 opacity-80">
                {lifecycleWarning}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {lifecycleError ? (
        <div
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3"
        >
          <Pill tone="rose" className="flex-none">
            {lifecycleError.status ? `HTTP ${lifecycleError.status}` : 'error'}
          </Pill>
          <div className="text-[13.5px] text-error leading-relaxed">
            <p>{lifecycleError.message || t('villages_deploy_error_generic')}</p>
            {lifecycleError.code ? (
              <p className="text-[11.5px] font-mono mt-1 opacity-70">
                {lifecycleError.code}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>

    {isRetireModalOpen ? (
      <Modal closeModal={() => setIsRetireModalOpen(false)}>
        <h2 className="font-serif text-xl text-foreground leading-tight">
          {t('villages_lifecycle_retire_modal_title')}
        </h2>
        <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
          {t('villages_lifecycle_retire_modal_body')}
        </p>
        <div className="flex flex-col gap-1.5 mt-4">
          <label className={labelClass} htmlFor="retire-confirm-slug">
            {t('villages_lifecycle_retire_modal_slug_label')}
          </label>
          <input
            id="retire-confirm-slug"
            className={inputClass}
            value={retireSlugInput}
            onChange={(event) => {
              setRetireSlugInput(event.target.value);
              setRetireFieldError(null);
            }}
            placeholder={
              village.slug || t('villages_lifecycle_retire_modal_slug_placeholder')
            }
          />
        </div>
        {retireFieldError ? (
          <p role="alert" className="text-[13px] text-error mt-2">
            {retireFieldError}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            type="button"
            className={btnPrimary}
            disabled={isLifecycleSubmitting}
            onClick={handleRetireSubmit}
          >
            {isLifecycleSubmitting ? <Spinner /> : null}
            {t('villages_lifecycle_retire_modal_cta')}
          </button>
          <button
            type="button"
            className={btnSmall}
            disabled={isLifecycleSubmitting}
            onClick={() => setIsRetireModalOpen(false)}
          >
            {t('villages_lifecycle_cancel_cta')}
          </button>
        </div>
      </Modal>
    ) : null}
    </>
  );
};

export default DeployCTA;
