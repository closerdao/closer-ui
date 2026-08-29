import Image from 'next/image';
import Link from 'next/link';

import { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import UserAvatarPlaceholder from '../../UserAvatarPlaceholder';
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
    amber: 'bg-amber-50 text-amber-800',
    green: 'bg-green-50 text-green-700',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tones[tone]}`}
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
  <article
    className={`rounded-3xl border p-5 bg-background ${
      warn ? 'border-amber-300' : 'border-gray-200'
    }`}
  >
    {children}
  </article>
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
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {label}
        </span>
        <span
          className={`text-sm font-bold ${done ? 'text-green-700' : 'text-foreground'}`}
        >
          {value}
          <span className="text-gray-400 font-semibold">/{target}</span>
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
    <div
      className="flex items-center gap-1"
      role="list"
      aria-label={stage}
    >
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
              className={`h-0.5 w-2.5 ${i < idx ? 'bg-accent' : 'bg-gray-200'}`}
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
      } bg-accent-light text-accent text-xs font-extrabold`}
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
  const steps: { key: CitizenApplicationStage | 'citizen'; label: string }[] =
    [
      ...CITIZEN_APPLICATION_STAGES.map((s) => ({
        key: s as CitizenApplicationStage | 'citizen',
        label: t(`citizen_funnel_stage_${s}`),
      })),
      { key: 'citizen', label: t('citizen_funnel_stage_citizen') },
    ];

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: 'none' }}
      role="toolbar"
      aria-label={t('citizen_funnel_strip_label')}
    >
      {steps.map((s) => {
        const isCitizen = s.key === 'citizen';
        const isActive = active === s.key;
        const count = isCitizen ? citizenCount : counts[s.key] || 0;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onPick(s.key)}
            aria-pressed={isActive}
            className={`shrink-0 text-left min-w-[92px] px-4 py-3 rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              isCitizen
                ? 'bg-foreground'
                : isActive
                ? 'bg-accent'
                : 'bg-accent-light'
            }`}
          >
            <div
              className={`font-black text-2xl leading-none ${
                isCitizen || isActive ? 'text-background' : 'text-foreground'
              }`}
            >
              {count}
            </div>
            <div
              className={`text-[10.5px] font-bold mt-1 uppercase tracking-wider ${
                isCitizen
                  ? 'text-background/70'
                  : isActive
                  ? 'text-background/85'
                  : 'text-accent'
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
  const minVouches = Math.max(
    1,
    signals.minVouchesNeeded ?? config.minVouches,
  );

  return (
    <FunnelCard>
      <div className="flex items-center gap-3">
        <Avatar photo={signals.photo} name={signals.screenname} />
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref(signals)}
            className="font-extrabold text-base text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            {signals.screenname || t('citizen_funnel_unnamed')}
          </Link>
          <p className="text-sm text-gray-500 truncate">
            {t(`citizen_funnel_stage_${stage}`)}
            {signals.citizenshipWhy ? ` · ${signals.citizenshipWhy}` : ''}
          </p>
        </div>
        <FunnelBadge tone="pink">{t(`citizen_funnel_stage_${stage}`)}</FunnelBadge>
      </div>
      <div className="mt-4">
        <FunnelStageDots stage={stage} />
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
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
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
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
        <Link
          href={profileHref(signals)}
          className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {t('citizen_funnel_open_profile')}
        </Link>
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
  const nights = evaluation.nightsInWindow ?? 0;
  const status = evaluation.presenceStatus;
  const nightsTarget = config.maintenanceMinNights;
  const nightsToGo = Math.max(0, nightsTarget - nights);

  return (
    <FunnelCard warn={status === 'risk' || evaluation.isAtRisk}>
      <div className="flex items-center gap-3">
        <Avatar
          photo={signals.photo}
          name={signals.screenname}
          warn={status === 'risk'}
        />
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref(signals)}
            className="font-extrabold text-base text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            {signals.screenname || t('citizen_funnel_unnamed')}
          </Link>
          <p className="text-sm text-gray-500">
            {t('citizen_funnel_tokens_held', {
              count: evaluation.tokensHeldOrFinanced,
            })}
            {evaluation.isFoundingCitizen
              ? ` · ${t('citizen_funnel_founding')}`
              : ''}
          </p>
        </div>
        {status === 'met' && (
          <FunnelBadge tone="green">{t('citizen_funnel_status_met')}</FunnelBadge>
        )}
        {status === 'on-track' && !evaluation.isAtRisk && (
          <FunnelBadge>{t('citizen_funnel_status_on_track')}</FunnelBadge>
        )}
        {(status === 'risk' || evaluation.isAtRisk) && (
          <FunnelBadge tone="amber">{t('citizen_funnel_status_at_risk')}</FunnelBadge>
        )}
      </div>
      <div className="mt-4">
        <FunnelMeter
          label={t('citizen_funnel_meter_presence')}
          value={nights}
          target={nightsTarget}
          done={status === 'met'}
        />
        <p
          className={`text-sm mt-2 ${
            status === 'risk' ? 'text-amber-800' : 'text-gray-400'
          }`}
        >
          {status === 'met'
            ? t('citizen_funnel_presence_met')
            : t('citizen_funnel_presence_remaining', { count: nightsToGo })}
        </p>
      </div>
      {evaluation.reasons.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {evaluation.reasons.map((reason) => (
            <FunnelBadge key={reason} tone="amber">
              {t(`citizen_funnel_risk_${reason}`)}
            </FunnelBadge>
          ))}
        </div>
      )}
      {(status === 'risk' || evaluation.isAtRisk) && (
        <div className="mt-4">
          <Link
            href={profileHref(signals)}
            className="inline-flex w-full items-center justify-center min-h-[44px] rounded-full bg-accent text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('citizen_funnel_open_profile')}
          </Link>
        </div>
      )}
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

  return (
    <FunnelCard>
      <div className="flex items-center gap-3">
        <div
          className={`w-6 text-center font-black text-xl ${
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
            className="font-extrabold text-base text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
          >
            {signals.screenname || t('citizen_funnel_unnamed')}
          </Link>
          <p className="text-sm text-gray-500 truncate">
            {signals.email || '—'}
          </p>
        </div>
        <div className="text-right">
          <div className="font-black text-lg text-accent">
            {Math.round(recommendation.score * 100)}%
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {t('citizen_funnel_ready_label')}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
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
      <p className="text-sm text-gray-500 mt-2.5">
        {gapParts.length === 0
          ? t('citizen_funnel_meets_thresholds')
          : gapParts.join(' · ')}
      </p>
      <div className="mt-4">
        <Link
          href={profileHref(signals)}
          className="inline-flex w-full items-center justify-center min-h-[44px] rounded-full bg-accent text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {t('citizen_funnel_invite_apply')}
        </Link>
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
      value: `${config.maintenanceMinNights} / ${config.maintenanceNightsWindowYears * 12} mo`,
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
      label: t('citizen_funnel_config_readiness'),
      hint: t('citizen_funnel_config_readiness_hint'),
      value: String(config.recommendedReadinessThreshold),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FunnelCard>
        <h3 className="font-black text-lg text-foreground">
          {t('citizen_funnel_config_title')}
        </h3>
        <p className="text-sm text-gray-400 mt-1 mb-2">
          {t('citizen_funnel_config_subtitle')}
        </p>
        {rows.map((row) => (
          <div
            key={row.label}
            className="py-4 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold text-sm text-foreground">
                {row.label}
              </div>
              <div className="text-sm font-bold text-foreground shrink-0">
                {row.value}
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-1">{row.hint}</p>
          </div>
        ))}
        {isAdmin && (
          <Link
            href="/dashboard/admin/config"
            className="mt-5 inline-flex w-full items-center justify-center min-h-[44px] rounded-full bg-accent text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {t('citizen_funnel_config_edit')}
          </Link>
        )}
      </FunnelCard>
    </div>
  );
};
