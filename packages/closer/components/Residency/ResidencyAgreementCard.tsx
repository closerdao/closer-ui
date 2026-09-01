import Link from 'next/link';

import { FC, ReactNode } from 'react';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useTranslations } from 'next-intl';

import {
  ResidencyAgreement,
  ResidencyAgreementStatus,
} from '../../types/residency';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';

dayjs.extend(utc);

/**
 * Dates come off the frozen `program` snapshot as UTC midnights, so they are
 * read back in UTC: a local parse renders the day before everywhere west of
 * Greenwich, and renders it differently on the server than in the browser,
 * which fails hydration for the whole list.
 */
const formatDate = (value?: string | null) =>
  value ? dayjs.utc(value).format('D MMM YYYY') : '';

const STATUS_KEYS: Record<ResidencyAgreementStatus, string> = {
  pending: 'residencies_status_pending',
  countersigned: 'residencies_status_countersigned',
  cancelled: 'residencies_status_cancelled',
};

const STATUS_VARIANTS: Record<
  ResidencyAgreementStatus,
  'default' | 'warning' | 'destructive'
> = {
  pending: 'warning',
  countersigned: 'default',
  cancelled: 'destructive',
};

const Fact: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] uppercase tracking-[0.14em] text-complimentary-light">
      {label}
    </span>
    <span className="text-sm font-semibold text-complimentary-core">
      {children}
    </span>
  </div>
);

interface Props {
  agreement: ResidencyAgreement;
  /** Name of the volunteer who signed, when the viewer may see other people's. */
  volunteerName?: string;
  /** The room actually taken, by name. Falls back to nothing when unresolved. */
  accommodationName?: string;
  tokenSymbol: string;
  formatCurrency: (value: number) => string;
  canApprove: boolean;
  canCancel: boolean;
  /** Why cancelling is not offered, when the season has already started. */
  cancelLockedNote?: string | null;
  isBusy: boolean;
  onApprove: () => void;
  onCancel: () => void;
  onReadAgreement: () => void;
}

/**
 * One signed season, as filed. Everything shown is read off the agreement's
 * own frozen `program` snapshot rather than recomputed, so a later edit to the
 * residency config, a listing price or the token price cannot move what a
 * volunteer already signed.
 */
const ResidencyAgreementCard: FC<Props> = ({
  agreement,
  volunteerName,
  accommodationName,
  tokenSymbol,
  formatCurrency,
  canApprove,
  canCancel,
  cancelLockedNote,
  isBusy,
  onApprove,
  onCancel,
  onReadAgreement,
}) => {
  const t = useTranslations();
  const { program } = agreement;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-dominant p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-accent">
            {t('residencies_season_eyebrow', {
              season: program.seasonLabel,
              year: dayjs.utc(program.startDate).format('YYYY'),
            })}
          </p>
          <h2 className="m-0 text-xl font-bold text-complimentary-core">
            {agreement.roleTitle}
          </h2>
          {volunteerName && (
            <p className="m-0 text-sm text-complimentary-light">
              {volunteerName}
            </p>
          )}
        </div>
        <Badge variant={STATUS_VARIANTS[agreement.status]}>
          {t(STATUS_KEYS[agreement.status])}
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label={t('residencies_fact_window')}>
          {t('residencies_season_window', {
            start: formatDate(program.startDate),
            end: formatDate(program.endDate),
          })}
        </Fact>
        <Fact label={t('residencies_fact_rhythm')}>
          {t('residencies_rhythm', { halfDays: program.halfDaysPerWeek })}
        </Fact>
        <Fact label={t('residencies_fact_room')}>
          {program.needsAccommodation
            ? accommodationName || t('residencies_room_unnamed')
            : t('residencies_room_self_housed')}
        </Fact>
        <Fact label={t('residencies_fact_allocation')}>
          {t('residencies_allocation', {
            amount: String(Number(program.seasonTokensDistributed.toFixed(2))),
            symbol: tokenSymbol,
          })}
        </Fact>
      </div>

      {program.seasonFiatOwed > 0 && (
        <p className="m-0 text-sm text-accent">
          {t('residencies_owed', {
            amount: formatCurrency(program.seasonFiatOwed),
          })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-complimentary-light">
        <span>
          {t('residencies_signed_on', {
            date: formatDate(agreement.acceptedAt),
          })}
        </span>
        {agreement.countersignedAt && (
          <span>
            {t('residencies_countersigned_on', {
              date: formatDate(agreement.countersignedAt),
            })}
          </span>
        )}
        <span>
          {t('residencies_version', { version: agreement.agreementVersion })}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Link
          href={`/roles/${agreement.roleId}`}
          className="text-sm text-accent underline"
        >
          {t('residencies_view_role')}
        </Link>
        {agreement.stayId ? (
          <Link
            href={`/stay/${agreement.stayId}`}
            className="text-sm text-accent underline"
          >
            {t('residencies_view_stay')}
          </Link>
        ) : (
          <span className="text-sm text-complimentary-light">
            {t('residencies_no_stay')}
          </span>
        )}
        <button
          type="button"
          onClick={onReadAgreement}
          className="text-sm text-accent underline"
        >
          {t('residencies_read_agreement')}
        </button>

        <div className="flex flex-1 flex-wrap justify-end gap-2">
          {canApprove && (
            <Button
              size="small"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={onApprove}
            >
              {t('residencies_approve_cta')}
            </Button>
          )}
          {canCancel && (
            <Button
              size="small"
              variant="secondary"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={onCancel}
            >
              {t('residencies_cancel_cta')}
            </Button>
          )}
          {!canCancel && cancelLockedNote && (
            <span className="text-[13px] text-complimentary-light">
              {cancelLockedNote}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ResidencyAgreementCard;
