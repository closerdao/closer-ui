import Image from 'next/image';
import Link from 'next/link';

import { ReactNode } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Star,
  UserCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import UserAvatarPlaceholder from '../../UserAvatarPlaceholder';
import WalletDisplay from '../../display/walletDisplay';
import { Card, LinkButton } from '../../ui';

import {
  CitizenApplicationStage,
  CitizenAtRiskEvaluation,
  CitizenFunnelUserSignals,
  CitizenRecommendedScore,
  CITIZEN_APPLICATION_STAGES,
} from '../../../types/citizenFunnel';
import { cdn } from '../../../utils/api';
import {
  deriveApplicationStage,
  ResolvedCitizenshipFunnelConfig,
} from '../../../utils/citizenFunnel.helpers';

dayjs.extend(relativeTime);

export const FunnelBadge = ({
  children,
  tone = 'grey',
}: {
  children: ReactNode;
  tone?: 'grey' | 'pink' | 'amber' | 'green';
}) => {
  const tones = {
    grey: 'bg-gray-100 text-gray-600',
    pink: 'bg-accent-light text-accent',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-green-100 text-green-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

export const FunnelCard = ({
  children,
  warn = false,
}: {
  children: ReactNode;
  warn?: boolean;
}) => (
  <Card
    className={`shadow-md gap-3 bg-background h-full ${
      warn ? 'border border-amber-300' : ''
    }`}
  >
    {children}
  </Card>
);

export const FunnelMeter = ({
  label,
  value,
  target,
  done,
}: {
  label: string;
  value: number;
  target: number;
  done: boolean;
}) => {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span
          className={`text-sm font-bold ${
            done ? 'text-green-700' : 'text-foreground'
          }`}
        >
          {value}
          <span className="text-gray-400 font-normal">/{target}</span>
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            done ? 'bg-green-600' : 'bg-accent'
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
};

export const FunnelStageDots = ({
  stage,
}: {
  stage: CitizenApplicationStage;
}) => {
  const idx = CITIZEN_APPLICATION_STAGES.indexOf(stage);
  return (
    <div className="flex items-center gap-1" role="list" aria-label={stage}>
      {CITIZEN_APPLICATION_STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1" role="listitem">
          <div
            className={`rounded-full ${
              i < idx
                ? 'bg-accent'
                : i === idx
                ? 'bg-background border-[3px] border-accent'
                : 'bg-gray-200'
            }`}
            style={{
              width: i === idx ? 11 : 7,
              height: i === idx ? 11 : 7,
            }}
            aria-current={i === idx ? 'step' : undefined}
          />
          {i < CITIZEN_APPLICATION_STAGES.length - 1 && (
            <div
              className={`h-0.5 flex-1 min-w-[10px] ${
                i < idx ? 'bg-accent' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const Avatar = ({
  photo,
  name,
  warn,
}: {
  photo?: string | null;
  name?: string;
  warn?: boolean;
}) => {
  const initials = (name || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`h-10 w-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border-2 ${
        warn ? 'border-amber-300' : 'border-accent-light'
      } bg-accent-light text-accent text-xs font-bold`}
      aria-hidden={!photo}
    >
      {photo ? (
        <Image
          src={`${cdn}${photo}-profile-sm.jpg`}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      ) : name ? (
        initials
      ) : (
        <UserAvatarPlaceholder size="lg" />
      )}
    </div>
  );
};

const profileHref = (signals: CitizenFunnelUserSignals) =>
  signals.slug ? `/members/${signals.slug}` : `/members/${signals.userId}`;

export const CitizenFunnelStrip = ({
  counts,
  active,
  onPick,
  citizenCount,
}: {
  counts: Record<CitizenApplicationStage, number>;
  active: CitizenApplicationStage | 'citizen' | null;
  onPick: (key: CitizenApplicationStage | 'citizen') => void;
  citizenCount: number;
}) => {
  const t = useTranslations();
  const steps: { key: CitizenApplicationStage | 'citizen'; label: string }[] = [
    ...CITIZEN_APPLICATION_STAGES.map((s) => ({
      key: s as CitizenApplicationStage | 'citizen',
      label: t(`citizen_funnel_stage_${s}`),
    })),
    { key: 'citizen', label: t('citizen_funnel_stage_citizen') },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      role="toolbar"
      aria-label={t('citizen_funnel_strip_label')}
    >
      {steps.map((s) => {
        const isCitizen = s.key === 'citizen';
        const isActive = active === s.key;
        const count = isCitizen
          ? citizenCount
          : counts[s.key as CitizenApplicationStage] || 0;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onPick(s.key)}
            aria-pressed={isActive}
            className={`text-left px-4 py-3 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isCitizen
                ? 'bg-foreground'
                : isActive
                ? 'bg-accent'
                : 'bg-white hover:bg-accent-light'
            }`}
          >
            <div
              className={`font-bold text-2xl leading-none ${
                isCitizen || isActive ? 'text-background' : 'text-foreground'
              }`}
            >
              {count}
            </div>
            <div
              className={`text-xs mt-1 uppercase tracking-wide ${
                isCitizen
                  ? 'text-background/70'
                  : isActive
                  ? 'text-background/85'
                  : 'text-gray-500'
              }`}
            >
              {s.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};

/**
 * The compact per-user stats the admin user list shows, kept to the same
 * colours so the two screens read as one system. Everything is conditional:
 * a card for someone with no wallet activity stays as quiet as it was.
 */
const StatPill = ({
  tone,
  icon,
  children,
  title,
}: {
  tone: 'purple' | 'orange' | 'green' | 'blue' | 'yellow' | 'grey' | 'red';
  icon?: ReactNode;
  children: ReactNode;
  title?: string;
}) => {
  const tones = {
    purple: 'bg-purple-100 border-purple-400 text-purple-700',
    orange: 'bg-orange-100 border-orange-400 text-orange-700',
    green: 'bg-green-100 border-green-400 text-green-700',
    blue: 'bg-blue-100 border-blue-400 text-blue-700',
    yellow: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    grey: 'bg-gray-100 border-gray-300 text-gray-700',
    red: 'bg-red-100 border-red-400 text-red-700',
  };
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 border rounded px-1.5 py-0.5 text-xs whitespace-nowrap ${tones[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
};

const round = (value: number) => parseFloat(String(value || 0)).toFixed(0);

export const FunnelSignalPills = ({
  signals,
}: {
  signals: CitizenFunnelUserSignals;
}) => {
  const t = useTranslations();
  const pills: ReactNode[] = [];

  if (signals.tokenBalance > 0) {
    pills.push(
      <StatPill key="tdf" tone="purple" title={t('manage_users_token_balance')}>
        {round(signals.tokenBalance)} $TDF
      </StatPill>,
    );
  }
  if (signals.financedTokens > 0) {
    pills.push(
      <StatPill key="financed" tone="purple">
        +{round(signals.financedTokens)} {t('citizen_funnel_financed')}
      </StatPill>,
    );
  }
  if (signals.presenceBalance > 0) {
    pills.push(
      <StatPill
        key="presence"
        tone="orange"
        icon={<Home className="w-3 h-3" />}
      >
        {round(signals.presenceBalance)} $Presence
      </StatPill>,
    );
  }
  if (signals.sweatBalance > 0) {
    pills.push(
      <StatPill key="sweat" tone="green" icon={<Home className="w-3 h-3" />}>
        {round(signals.sweatBalance)} $Sweat
      </StatPill>,
    );
  }
  if (signals.vouchCount > 0) {
    pills.push(
      <StatPill
        key="vouches"
        tone="green"
        icon={<UserCheck className="w-3 h-3" />}
        title={t('manage_users_vouches')}
      >
        {signals.vouchCount}
      </StatPill>,
    );
  }
  if (signals.kycPassed) {
    pills.push(
      <StatPill
        key="kyc"
        tone="blue"
        icon={<CheckCircle className="w-3 h-3" />}
        title={t('manage_users_kyc_passed')}
      >
        KYC
      </StatPill>,
    );
  }
  if (signals.subscriptionPlan) {
    pills.push(
      <StatPill key="plan" tone="grey">
        {signals.subscriptionPlan.slice(0, 1).toUpperCase() +
          signals.subscriptionPlan.slice(1)}
      </StatPill>,
    );
  }
  if (signals.citizenshipDate) {
    pills.push(
      <StatPill key="citizen" tone="yellow" icon={<Star className="w-3 h-3" />}>
        {t('manage_users_citizen')}
      </StatPill>,
    );
  }
  if (signals.hasDelinquentFinancePlan) {
    pills.push(
      <StatPill
        key="delinquent"
        tone="red"
        icon={<AlertTriangle className="w-3 h-3" />}
      >
        {t('citizen_funnel_finance_overdue')}
      </StatPill>,
    );
  }

  if (pills.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5">{pills}</div>;
};

/** Joined / last active / citizen since — the timeline manage-users shows. */
export const FunnelTimeline = ({
  signals,
}: {
  signals: CitizenFunnelUserSignals;
}) => {
  const t = useTranslations();
  const parts: { key: string; label: string; value: string }[] = [];

  if (signals.citizenshipDate) {
    parts.push({
      key: 'citizen-since',
      label: t('manage_users_citizen_since'),
      value: dayjs(signals.citizenshipDate).format('MMM D, YYYY'),
    });
  } else if (signals.citizenshipAppliedAt) {
    parts.push({
      key: 'applied',
      label: t('manage_users_citizenship_applied'),
      value: dayjs(signals.citizenshipAppliedAt).format('MMM D, YYYY'),
    });
  } else if (signals.created) {
    parts.push({
      key: 'joined',
      label: t('manage_users_joined'),
      value: dayjs(signals.created).format('MMM D, YYYY'),
    });
  }

  if (signals.lastActive) {
    parts.push({
      key: 'last-active',
      label: t('manage_users_last_active'),
      value: dayjs(signals.lastActive).fromNow(),
    });
  }

  if (parts.length === 0 && !signals.walletAddress) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
      {parts.map((part) => (
        <span key={part.key} className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-gray-400" />
          {part.label}: <span className="text-gray-700">{part.value}</span>
        </span>
      ))}
      {signals.walletAddress && (
        <WalletDisplay
          address={signals.walletAddress}
          variant="inline"
          className="text-xs"
        />
      )}
    </div>
  );
};

const RowHeader = ({
  signals,
  meta,
  warn,
  children,
}: {
  signals: CitizenFunnelUserSignals;
  meta?: ReactNode;
  warn?: boolean;
  children?: ReactNode;
}) => {
  const t = useTranslations();
  return (
    <div className="flex items-start gap-3">
      <Avatar photo={signals.photo} name={signals.screenname} warn={warn} />
      <div className="flex-1 min-w-0">
        <Link
          href={profileHref(signals)}
          className="font-bold text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
        >
          {signals.screenname || t('citizen_funnel_unnamed')}
        </Link>
        {meta && <p className="text-sm text-gray-500 truncate m-0">{meta}</p>}
      </div>
      {children}
    </div>
  );
};

export const CitizenFunnelApplicationRow = ({
  signals,
  config,
}: {
  signals: CitizenFunnelUserSignals;
  config: ResolvedCitizenshipFunnelConfig;
}) => {
  const t = useTranslations();
  const nights = signals.totalNights ?? 0;
  const tokens = signals.tokenBalance + signals.financedTokens;
  const stage = deriveApplicationStage(signals, config);
  const minVouches = Math.max(1, signals.minVouchesNeeded ?? config.minVouches);

  return (
    <FunnelCard>
      <RowHeader signals={signals} meta={signals.email}>
        <FunnelBadge tone={stage === 'ready' ? 'green' : 'pink'}>
          {t(`citizen_funnel_stage_${stage}`)}
        </FunnelBadge>
      </RowHeader>

      <FunnelSignalPills signals={signals} />
      <FunnelTimeline signals={signals} />

      <FunnelStageDots stage={stage} />

      <div className="grid grid-cols-2 gap-4">
        <FunnelMeter
          label={t('citizen_funnel_meter_nights')}
          value={nights}
          target={config.minStayDuration}
          done={nights >= config.minStayDuration}
        />
        <FunnelMeter
          label={t('citizen_funnel_meter_tokens')}
          value={tokens}
          target={config.tokensRequired}
          done={tokens >= config.tokensRequired}
        />
      </div>

      {(signals.citizenshipStatus ||
        signals.citizenshipTokensToFinance !== null ||
        signals.citizenshipTotalToPayInFiat !== null) && (
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 m-0 text-xs">
          {signals.citizenshipStatus && (
            <div className="flex flex-col">
              <dt className="text-gray-400">
                {t('manage_users_citizenship_status')}
              </dt>
              <dd className="m-0 text-gray-700">{signals.citizenshipStatus}</dd>
            </div>
          )}
          {signals.citizenshipTokensToFinance !== null && (
            <div className="flex flex-col">
              <dt className="text-gray-400">
                {t('manage_users_citizenship_tokens_financed')}
              </dt>
              <dd className="m-0 text-gray-700">
                {signals.citizenshipTokensToFinance} TDF
              </dd>
            </div>
          )}
          {signals.citizenshipTotalToPayInFiat !== null && (
            <div className="flex flex-col">
              <dt className="text-gray-400">
                {t('manage_users_citizenship_total_to_pay')}
              </dt>
              <dd className="m-0 text-gray-700">
                €{signals.citizenshipTotalToPayInFiat}
              </dd>
            </div>
          )}
        </dl>
      )}

      {signals.citizenshipWhy && (
        <p className="text-sm text-gray-600 italic m-0 line-clamp-3">
          &ldquo;{signals.citizenshipWhy}&rdquo;
        </p>
      )}

      <div className="flex items-center justify-between gap-3 text-sm text-gray-500">
        <span>
          {t('citizen_funnel_vouches_label')}{' '}
          <strong
            className={
              signals.vouchCount >= minVouches
                ? 'text-green-700'
                : 'text-foreground'
            }
          >
            {signals.vouchCount}/{minVouches}
          </strong>
        </span>
        <LinkButton
          href={profileHref(signals)}
          size="small"
          variant="secondary"
          isFullWidth={false}
        >
          {t('citizen_funnel_open_profile')}
        </LinkButton>
      </div>
    </FunnelCard>
  );
};

export const CitizenFunnelCitizenRow = ({
  signals,
  evaluation,
  config,
}: {
  signals: CitizenFunnelUserSignals;
  evaluation: CitizenAtRiskEvaluation;
  config: ResolvedCitizenshipFunnelConfig;
}) => {
  const t = useTranslations();
  const status = evaluation.presenceStatus;
  const isAtRisk = evaluation.isAtRisk;
  const nightsTarget = config.maintenanceMinNights;
  /** `null` means the window could not be read, not "zero nights". */
  const nightsKnown = evaluation.nightsInWindow !== null;
  const nights = evaluation.nightsInWindow ?? 0;
  const nightsToGo = Math.max(0, nightsTarget - nights);

  return (
    <FunnelCard warn={isAtRisk}>
      <RowHeader
        signals={signals}
        warn={isAtRisk}
        meta={
          <>
            {t('citizen_funnel_tokens_held', {
              count: evaluation.tokensHeldOrFinanced,
            })}
            {evaluation.isFoundingCitizen
              ? ` · ${t('citizen_funnel_founding')}`
              : ''}
          </>
        }
      >
        {isAtRisk ? (
          <FunnelBadge tone="amber">
            {t('citizen_funnel_status_at_risk')}
          </FunnelBadge>
        ) : status === 'met' ? (
          <FunnelBadge tone="green">
            {t('citizen_funnel_status_met')}
          </FunnelBadge>
        ) : (
          <FunnelBadge>{t('citizen_funnel_status_on_track')}</FunnelBadge>
        )}
      </RowHeader>

      <FunnelSignalPills signals={signals} />
      <FunnelTimeline signals={signals} />

      {nightsKnown ? (
        <div className="flex flex-col gap-1">
          <FunnelMeter
            label={t('citizen_funnel_meter_presence')}
            value={nights}
            target={nightsTarget}
            done={status === 'met'}
          />
          <p
            className={`text-sm m-0 ${
              status === 'risk' ? 'text-amber-800' : 'text-gray-500'
            }`}
          >
            {status === 'met'
              ? t('citizen_funnel_presence_met')
              : t('citizen_funnel_presence_remaining', { count: nightsToGo })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 m-0">
          {t('citizen_funnel_presence_unknown')}
        </p>
      )}

      {evaluation.reasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {evaluation.reasons.map((reason) => (
            <FunnelBadge key={reason} tone="amber">
              {t(`citizen_funnel_risk_${reason}`)}
            </FunnelBadge>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <LinkButton
          href={profileHref(signals)}
          size="small"
          variant="secondary"
          isFullWidth={false}
        >
          {t('citizen_funnel_open_profile')}
        </LinkButton>
      </div>
    </FunnelCard>
  );
};

export const CitizenFunnelRecommendedRow = ({
  signals,
  recommendation,
  rank,
}: {
  signals: CitizenFunnelUserSignals;
  recommendation: CitizenRecommendedScore;
  rank: number;
}) => {
  const t = useTranslations();
  const gapParts = [
    recommendation.nightsShort > 0
      ? t('citizen_funnel_nights_short_gap', {
          count: recommendation.nightsShort,
        })
      : null,
    recommendation.tokensShort > 0
      ? t('citizen_funnel_tokens_short_gap', {
          count: recommendation.tokensShort,
        })
      : null,
  ].filter(Boolean);

  /**
   * There is no invite endpoint yet, so the button opens a pre-addressed mail
   * to the candidate rather than pretending to send one. Without an email on
   * file it falls back to their profile.
   */
  const inviteHref = signals.email
    ? `mailto:${signals.email}?subject=${encodeURIComponent(
        t('citizen_funnel_invite_subject'),
      )}`
    : profileHref(signals);

  return (
    <FunnelCard>
      <div className="flex items-start gap-3">
        <div
          className={`w-6 text-center font-bold text-xl shrink-0 ${
            rank === 1 ? 'text-accent' : 'text-gray-300'
          }`}
          aria-label={t('citizen_funnel_rank', { rank })}
        >
          {rank}
        </div>
        <Avatar photo={signals.photo} name={signals.screenname} />
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref(signals)}
            className="font-bold text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            {signals.screenname || t('citizen_funnel_unnamed')}
          </Link>
          <p className="text-sm text-gray-500 truncate m-0">
            {signals.email || '—'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-lg text-accent leading-none">
            {Math.round(recommendation.score * 100)}%
          </div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {t('citizen_funnel_ready_label')}
          </div>
        </div>
      </div>

      <FunnelSignalPills signals={signals} />
      <FunnelTimeline signals={signals} />

      <div className="grid grid-cols-2 gap-4">
        <FunnelMeter
          label={t('citizen_funnel_meter_nights')}
          value={recommendation.nights}
          target={recommendation.nightsRequired}
          done={recommendation.nightsProgress >= 1}
        />
        <FunnelMeter
          label={t('citizen_funnel_meter_tokens')}
          value={recommendation.tokens}
          target={recommendation.tokensRequired}
          done={recommendation.tokensProgress >= 1}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 m-0">
          {gapParts.length === 0
            ? t('citizen_funnel_meets_thresholds')
            : gapParts.join(' · ')}
        </p>
        <LinkButton href={inviteHref} size="small" isFullWidth={false}>
          {t('citizen_funnel_invite_apply')}
        </LinkButton>
      </div>
    </FunnelCard>
  );
};

export const CitizenFunnelConfigPanel = ({
  config,
  isAdmin,
}: {
  config: ResolvedCitizenshipFunnelConfig;
  isAdmin: boolean;
}) => {
  const t = useTranslations();
  const rows: { label: string; hint: string; value: string }[] = [
    {
      label: t('citizen_funnel_config_presence'),
      hint: t('citizen_funnel_config_presence_hint'),
      value: `${config.maintenanceMinNights} / ${
        config.maintenanceNightsWindowYears * 12
      } mo`,
    },
    {
      label: t('citizen_funnel_config_tokens'),
      hint: t('citizen_funnel_config_tokens_hint'),
      value: String(config.tokensRequired),
    },
    {
      label: t('citizen_funnel_config_vouches'),
      hint: t('citizen_funnel_config_vouches_hint'),
      value: String(config.minVouches),
    },
    {
      label: t('citizen_funnel_config_at_risk'),
      hint: t('citizen_funnel_config_at_risk_hint'),
      value: `${config.atRiskMonthsBeforeWindowEnd} mo`,
    },
    {
      label: t('citizen_funnel_config_recommended_list'),
      hint: t('citizen_funnel_config_recommended_list_hint'),
      value: `Top ${config.funnelRecommendedLimit} · ${config.funnelRecommendedMinNights}+ nights`,
    },
  ];

  return (
    <section className="bg-white rounded-md p-4 sm:p-6 flex flex-col gap-2 max-w-3xl">
      <div>
        <h3 className="font-bold text-lg text-foreground m-0">
          {t('citizen_funnel_config_title')}
        </h3>
        <p className="text-sm text-gray-500 m-0">
          {t('citizen_funnel_config_subtitle')}
        </p>
      </div>
      <dl className="m-0">
        {rows.map((row) => (
          <div
            key={row.label}
            className="py-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <dt className="font-bold text-sm text-foreground">{row.label}</dt>
              <dd className="text-sm font-bold text-foreground shrink-0 m-0">
                {row.value}
              </dd>
            </div>
            <p className="text-sm text-gray-500 mt-1 m-0">{row.hint}</p>
          </div>
        ))}
      </dl>
      {isAdmin && (
        <div className="flex justify-start pt-2">
          <LinkButton
            href="/dashboard/admin/config"
            size="small"
            isFullWidth={false}
          >
            {t('citizen_funnel_config_edit')}
          </LinkButton>
        </div>
      )}
    </section>
  );
};
