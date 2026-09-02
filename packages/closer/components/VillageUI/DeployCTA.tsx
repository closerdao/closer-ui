import Link from 'next/link';

import { FC, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Village } from '../../types/village';
import {
  CLOSER_DEPLOY_DOMAIN,
  DeployVillageError,
  DeployVillageResult,
  UpdateVillageInput,
  VillageAccessReason,
  deployVillage,
  getDeployReadiness,
  isValidVillageSubdomain,
  isVillageSlugFrozen,
  isVillageSubdomainTaken,
  normalizeVillageSubdomain,
  resolveFounderEmail,
  sanitizeVillageSubdomainInput,
  suggestVillageSubdomain,
  updateVillage,
} from '../../utils/village.utils';
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
  | 'failed';

export const getDeployCTAState = (village: Village): DeployCTAState => {
  const status = village.onboardingStatus;
  if (status === 'deploy_requested' || status === 'deploying') {
    return 'in_progress';
  }
  if (status === 'failed') return 'failed';
  if (status === 'suspended') return 'suspended';
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
  className?: string;
}> = ({
  village,
  canDeploy = false,
  isAdmin = false,
  accessReason = null,
  onDeployed,
  deploy = deployVillage,
  save = updateVillage,
  isSubdomainTaken = isVillageSubdomainTaken,
  className = '',
}) => {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<DeployVillageError | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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
    </section>
  );
};

export default DeployCTA;
