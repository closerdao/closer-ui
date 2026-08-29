import Image from 'next/image';
import Link from 'next/link';

import { ReactNode } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import UserAvatarPlaceholder from '../../UserAvatarPlaceholder';
import { cdn } from '../../../utils/api';
import {
  CitizenAtRiskEvaluation,
  CitizenAtRiskReason,
  CitizenFunnelUserSignals,
  CitizenRecommendedScore,
} from '../../../types/citizenFunnel';

const Pill = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'urgent' | 'success';
}) => {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700',
    accent: 'bg-accent-light text-accent',
    warning: 'bg-amber-100 text-amber-800',
    urgent: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-700',
  };
  return (
    <span
      className={`text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Avatar = ({
  photo,
  name,
}: {
  photo?: string | null;
  name?: string;
}) => (
  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
    {photo ? (
      <Image
        src={`${cdn}${photo}-profile-sm.jpg`}
        alt={name || ''}
        width={40}
        height={40}
        className="h-full w-full object-cover"
      />
    ) : (
      <UserAvatarPlaceholder size="lg" />
    )}
  </div>
);

const profileHref = (signals: CitizenFunnelUserSignals) =>
  signals.slug ? `/members/${signals.slug}` : `/members/${signals.userId}`;

const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const d = dayjs(value);
  return d.isValid() ? d.format('YYYY-MM-DD') : '—';
};

const ProgressBar = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col gap-1 min-w-[120px]">
    <div className="flex justify-between text-xs text-gray-500">
      <span>{label}</span>
      <span>{Math.round(value * 100)}%</span>
    </div>
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full bg-accent rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
      />
    </div>
  </div>
);

export const CitizenFunnelApplicationRow = ({
  signals,
  nightsRequired,
  tokensRequired,
}: {
  signals: CitizenFunnelUserSignals;
  nightsRequired: number;
  tokensRequired: number;
}) => {
  const t = useTranslations();
  const nights = signals.totalNights ?? 0;
  const tokens = signals.tokenBalance + signals.financedTokens;

  return (
    <div className="bg-white rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar photo={signals.photo} name={signals.screenname} />
          <div className="flex flex-col gap-1">
            <Link
              href={profileHref(signals)}
              className="font-bold hover:underline"
            >
              {signals.screenname || t('citizen_funnel_unnamed')}
            </Link>
            <p className="text-sm text-gray-600 break-all">
              {signals.email || '—'}
            </p>
            <p className="text-xs text-gray-500">
              {t('citizen_funnel_applied_on', {
                date: formatDate(signals.citizenshipAppliedAt),
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {signals.citizenshipStatus && (
            <Pill tone="accent">{signals.citizenshipStatus}</Pill>
          )}
          <Pill>
            {t('citizen_funnel_nights_short', {
              count: nights,
              required: nightsRequired,
            })}
          </Pill>
          <Pill>
            {t('citizen_funnel_tokens_short', {
              count: tokens,
              required: tokensRequired,
            })}
          </Pill>
          <Pill>
            {t('citizen_funnel_vouches_short', { count: signals.vouchCount })}
          </Pill>
        </div>
      </div>
      {signals.citizenshipWhy && (
        <p className="text-sm text-gray-700 line-clamp-3">
          {signals.citizenshipWhy}
        </p>
      )}
    </div>
  );
};

const atRiskTone = (reason: CitizenAtRiskReason) =>
  reason === 'finance' || reason === 'presence' ? 'urgent' : 'warning';

export const CitizenFunnelCitizenRow = ({
  signals,
  evaluation,
  tokensRequired,
  maintenanceMinNights,
}: {
  signals: CitizenFunnelUserSignals;
  evaluation: CitizenAtRiskEvaluation;
  tokensRequired: number;
  maintenanceMinNights: number;
}) => {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar photo={signals.photo} name={signals.screenname} />
          <div className="flex flex-col gap-1">
            <Link
              href={profileHref(signals)}
              className="font-bold hover:underline"
            >
              {signals.screenname || t('citizen_funnel_unnamed')}
            </Link>
            <p className="text-sm text-gray-600 break-all">
              {signals.email || '—'}
            </p>
            <p className="text-xs text-gray-500">
              {t('citizen_funnel_citizen_since', {
                date: formatDate(
                  signals.citizenshipDate || signals.citizenshipAppliedAt,
                ),
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {evaluation.isAtRisk ? (
            <Pill tone="urgent">{t('citizen_funnel_status_at_risk')}</Pill>
          ) : (
            <Pill tone="success">{t('citizen_funnel_status_healthy')}</Pill>
          )}
          {evaluation.isFoundingCitizen && (
            <Pill>{t('citizen_funnel_founding')}</Pill>
          )}
          {evaluation.reasons.map((reason) => (
            <Pill key={reason} tone={atRiskTone(reason)}>
              {t(`citizen_funnel_risk_${reason}`)}
            </Pill>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>
          {t('citizen_funnel_nights_window', {
            count:
              evaluation.nightsInWindow === null
                ? '—'
                : evaluation.nightsInWindow,
            required: maintenanceMinNights,
          })}
        </span>
        <span>
          {t('citizen_funnel_tokens_short', {
            count: evaluation.tokensHeldOrFinanced,
            required: tokensRequired,
          })}
        </span>
        <span>
          {t('citizen_funnel_votes_short', {
            primary:
              signals.votesInPrimaryWindow === null
                ? '—'
                : signals.votesInPrimaryWindow,
            alt:
              signals.votesInAltWindow === null
                ? '—'
                : signals.votesInAltWindow,
          })}
        </span>
      </div>
    </div>
  );
};

export const CitizenFunnelRecommendedRow = ({
  signals,
  recommendation,
}: {
  signals: CitizenFunnelUserSignals;
  recommendation: CitizenRecommendedScore;
}) => {
  const t = useTranslations();

  return (
    <div className="bg-white rounded-md p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar photo={signals.photo} name={signals.screenname} />
          <div className="flex flex-col gap-1">
            <Link
              href={profileHref(signals)}
              className="font-bold hover:underline"
            >
              {signals.screenname || t('citizen_funnel_unnamed')}
            </Link>
            <p className="text-sm text-gray-600 break-all">
              {signals.email || '—'}
            </p>
            <p className="text-xs text-gray-500">
              {t('citizen_funnel_recommended_score', {
                score: Math.round(recommendation.score * 100),
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <ProgressBar
            value={recommendation.nightsProgress}
            label={t('citizen_funnel_nights_short', {
              count: recommendation.nights,
              required: recommendation.nightsRequired,
            })}
          />
          <ProgressBar
            value={recommendation.tokensProgress}
            label={t('citizen_funnel_tokens_short', {
              count: recommendation.tokens,
              required: recommendation.tokensRequired,
            })}
          />
        </div>
      </div>
    </div>
  );
};
