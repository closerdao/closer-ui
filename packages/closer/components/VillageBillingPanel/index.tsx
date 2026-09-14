import Link from 'next/link';

import { FC, useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  VillageBillingCredentials,
  VillageBillingError,
  VillageBillingStatus,
  VillageBillingSummary,
  fetchVillageBilling,
  rotateVillageBilling,
  setVillageBillingStatus,
} from '../../utils/villageBilling.utils';
import {
  Eyebrow,
  Pill,
  btnPrimary,
  btnSmall,
  btnSmallPrimary,
  inputClass,
  labelClass,
} from '../VillageUI';
import { formatDeployDate } from '../VillageUI/DeployCTA';
import { Checkbox, ErrorMessage, Spinner } from '../ui';

type Props = {
  villageId: string;
  /** Named in the revoke confirmation, so the admin sees what they are killing. */
  villageName?: string;
  /** What has to be typed to confirm a revoke, matching the API's own pattern. */
  villageSlug?: string;
};

const statusTones = {
  none: 'neutral',
  active: 'mint',
  suspended: 'amber',
  revoked: 'rose',
} as const;

/** One `field: value` row of the summary. */
const Field: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
      {label}
    </span>
    <span className="text-[14.5px] text-foreground break-all">{value}</span>
  </div>
);

/**
 * A copyable `KEY=value` line from the env triple. The value is selectable as
 * well as copyable — an admin pasting into a dashboard by hand needs both.
 */
const EnvRow: FC<{ name: string; value: string }> = ({ name, value }) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // A refused clipboard is not worth an error state — the value is on
      // screen and selectable either way.
    }
  };

  return (
    <div className="rounded-xl border border-neutral-dark bg-neutral-light px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-foreground/50">
          {name}
        </p>
        <p className="font-mono text-[13px] text-foreground break-all mt-1">
          {value}
        </p>
      </div>
      <button type="button" className={`${btnSmall} flex-none`} onClick={copy}>
        {copied ? t('villages_billing_copied') : t('villages_billing_copy')}
      </button>
    </div>
  );
};

/**
 * The one-time secret. Shown in a modal rather than inline because inline state
 * gets scrolled past or re-rendered away, and this value cannot be fetched
 * again — dismissal is gated on an explicit acknowledgement for the same reason.
 */
const SecretModal: FC<{
  credentials: VillageBillingCredentials;
  onDismiss: () => void;
}> = ({ credentials, onDismiss }) => {
  const t = useTranslations();
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={t('villages_billing_secret_title')}
    >
      {/* No backdrop dismissal and no ×: closing this by accident costs a
          rotation and a second message to whoever runs the village. */}
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative z-[101] w-full sm:w-[560px] max-h-[92vh] overflow-y-auto bg-background rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-lg">
        <Eyebrow>{t('villages_billing_eyebrow')}</Eyebrow>
        <h2 className="font-serif text-2xl mt-3 text-foreground">
          {t('villages_billing_secret_title')}
        </h2>
        <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
          {t('villages_billing_secret_warning')}
        </p>

        <div className="flex flex-col gap-3 mt-6">
          <EnvRow name="BILLING_SECRET" value={credentials.secret} />
          <EnvRow name="BILLING_HUB_URL" value={credentials.hubUrl || ''} />
          <EnvRow name="BILLING_VILLAGE_ID" value={credentials.villageId} />
        </div>

        <Checkbox
          id="villages-billing-secret-ack"
          className="mt-6"
          isChecked={acknowledged}
          onChange={() => setAcknowledged((prev) => !prev)}
        >
          {t('villages_billing_secret_ack')}
        </Checkbox>

        <button
          type="button"
          disabled={!acknowledged}
          onClick={onDismiss}
          className={`${btnPrimary} mt-6 w-full`}
        >
          {t('villages_billing_secret_done')}
        </button>
      </div>
    </div>
  );
};

/**
 * Admin-only billing credentials for one village.
 *
 * There is nothing to turn on here beyond issuing a secret: a hub deploy issues
 * credentials in the same write as the deploy request, so this panel exists for
 * the villages that predate that — and for rotating a secret that has leaked.
 */
const VillageBillingPanel = ({
  villageId,
  villageName,
  villageSlug,
}: Props) => {
  const t = useTranslations();
  const [summary, setSummary] = useState<VillageBillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<VillageBillingError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [credentials, setCredentials] =
    useState<VillageBillingCredentials | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await fetchVillageBilling(villageId);
      setSummary(result);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof VillageBillingError
          ? err
          : new VillageBillingError(
              err instanceof Error ? err.message : 'Billing request failed',
              0,
            ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [villageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const status: VillageBillingStatus = summary?.status || 'none';

  const runStatusChange = async (
    next: Exclude<VillageBillingStatus, 'none'>,
  ) => {
    setActionError(null);
    setPending(next);
    try {
      const result = await setVillageBillingStatus(villageId, next);
      setSummary(result);
      setIsRevoking(false);
      setConfirmSlug('');
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : t('villages_billing_error_generic'),
      );
    } finally {
      setPending(null);
    }
  };

  const handleRotate = async () => {
    setActionError(null);
    setPending('rotate');
    try {
      const result = await rotateVillageBilling(villageId);
      setCredentials(result);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : t('villages_billing_error_generic'),
      );
    } finally {
      setPending(null);
    }
  };

  // The rotate response carries no dates by design, so the summary comes from a
  // refetch rather than a local patch.
  const handleSecretDismissed = () => {
    setCredentials(null);
    void load();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10" data-testid="billing-loading">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    const message =
      loadError.status === 403
        ? t('villages_billing_error_forbidden')
        : loadError.status === 404
        ? t('villages_billing_error_not_found')
        : loadError.message || t('villages_billing_error_generic');
    return (
      <div
        className="rounded-[18px] border border-neutral-dark bg-neutral-light px-5 py-4 text-[14.5px] text-foreground/70"
        data-testid="billing-load-error"
      >
        {message}
      </div>
    );
  }

  const isBusy = pending !== null;
  const canConfirmRevoke =
    !villageSlug || confirmSlug.trim() === villageSlug.trim();

  return (
    <div className="flex flex-col gap-6" data-testid="village-billing-panel">
      <div className="flex flex-wrap items-center gap-3">
        <Pill tone={statusTones[status]} data-testid="billing-status-pill">
          {t(`villages_billing_status_${status}`)}
        </Pill>
        {status === 'none' ? (
          <span className="text-[14px] text-foreground/70">
            {t('villages_billing_none_body')}
          </span>
        ) : null}
      </div>

      {status !== 'none' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 rounded-[18px] border border-accent-medium bg-accent-light/40 px-5 py-4">
          <Field
            label={t('villages_billing_hub_url')}
            value={summary?.hubUrl || '—'}
          />
          <Field
            label={t('villages_billing_issued_at')}
            value={formatDeployDate(summary?.issuedAt) || '—'}
          />
          <Field
            label={t('villages_billing_rotated_at')}
            value={formatDeployDate(summary?.rotatedAt) || '—'}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={btnSmallPrimary}
          disabled={isBusy}
          onClick={handleRotate}
        >
          {pending === 'rotate'
            ? t('villages_billing_working')
            : status === 'none'
            ? t('villages_billing_issue')
            : t('villages_billing_rotate')}
        </button>

        {/* Suspend/reactivate answer 409 before any credentials exist, so they
            are not offered at all in the `none` state. */}
        {status === 'active' ? (
          <button
            type="button"
            className={btnSmall}
            disabled={isBusy}
            onClick={() => runStatusChange('suspended')}
          >
            {pending === 'suspended'
              ? t('villages_billing_working')
              : t('villages_billing_suspend')}
          </button>
        ) : null}

        {status === 'suspended' || status === 'revoked' ? (
          <button
            type="button"
            className={btnSmall}
            disabled={isBusy}
            onClick={() => runStatusChange('active')}
          >
            {pending === 'active'
              ? t('villages_billing_working')
              : t('villages_billing_reactivate')}
          </button>
        ) : null}

        {status === 'active' || status === 'suspended' ? (
          <button
            type="button"
            className={`${btnSmall} !text-error !border-error/40`}
            disabled={isBusy}
            onClick={() => setIsRevoking(true)}
          >
            {t('villages_billing_revoke')}
          </button>
        ) : null}
      </div>

      {status === 'suspended' ? (
        <p className="text-[13.5px] text-foreground/70">
          {t('villages_billing_suspended_hint')}
        </p>
      ) : null}

      {status === 'revoked' ? (
        <p className="text-[13.5px] text-foreground/70">
          {t('villages_billing_revoked_hint')}
        </p>
      ) : null}

      {/* Revoke has no inverse verb of its own — recovery is rotate, then
          reactivate — so it asks for the slug the way the API's own lifecycle
          actions do. */}
      {isRevoking ? (
        <div
          className="rounded-[18px] border border-error/30 bg-error/5 px-5 py-4 flex flex-col gap-3"
          data-testid="billing-revoke-confirm"
        >
          <p className="text-[14.5px] text-foreground">
            {t('villages_billing_revoke_confirm', {
              name: villageName || villageSlug || '',
            })}
          </p>
          {villageSlug ? (
            <label className="flex flex-col gap-2 max-w-xs">
              <span className={labelClass}>
                {t('villages_billing_revoke_type_slug', { slug: villageSlug })}
              </span>
              <input
                className={inputClass}
                value={confirmSlug}
                onChange={(event) => setConfirmSlug(event.target.value)}
                placeholder={villageSlug}
              />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={`${btnSmall} !text-error !border-error/40`}
              disabled={isBusy || !canConfirmRevoke}
              onClick={() => runStatusChange('revoked')}
            >
              {pending === 'revoked'
                ? t('villages_billing_working')
                : t('villages_billing_revoke_cta')}
            </button>
            <button
              type="button"
              className={btnSmall}
              disabled={isBusy}
              onClick={() => {
                setIsRevoking(false);
                setConfirmSlug('');
              }}
            >
              {t('villages_billing_cancel')}
            </button>
          </div>
        </div>
      ) : null}

      {actionError ? <ErrorMessage error={actionError} /> : null}

      <p className="text-[13px] text-foreground/60">
        {t('villages_billing_charges_hint')}{' '}
        <Link
          href="/dashboard/affiliate"
          className="font-semibold text-accent-text hover:underline"
        >
          {t('villages_billing_charges_link')}
        </Link>
      </p>

      {credentials ? (
        <SecretModal
          credentials={credentials}
          onDismiss={handleSecretDismissed}
        />
      ) : null}
    </div>
  );
};

export default VillageBillingPanel;
