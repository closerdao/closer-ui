import { ReactNode } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { useConfig } from '../../hooks/useConfig';
import { LinkButton } from '../ui';

interface QuestCardProps {
  icon: string;
  title: string;
  tag: string;
  isComplete: boolean;
  progress: number;
  children?: ReactNode;
  lockedMessage?: string | null;
  className?: string;
}

const QuestCard = ({
  icon,
  title,
  tag,
  isComplete,
  progress,
  children,
  lockedMessage,
  className,
}: QuestCardProps) => (
  <div
    className={`relative overflow-hidden rounded-2xl border p-5 ${
      isComplete
        ? 'border-accent bg-accent-light'
        : 'border-gray-200 bg-white'
    } ${className || ''}`}
  >
    {lockedMessage && (
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/80 p-5 text-center backdrop-blur-sm">
        <span className="text-3xl">🔒</span>
        <p className="max-w-xs text-sm text-gray-600">{lockedMessage}</p>
      </div>
    )}
    <div className="mb-3 flex items-center gap-3">
      <div
        className={`grid h-11 w-11 place-items-center rounded-xl text-2xl ${
          isComplete ? 'bg-accent/20' : 'bg-gray-100'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-xs text-gray-500">{tag}</p>
      </div>
    </div>
    <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
      />
    </div>
    {children}
  </div>
);

interface Props {
  hasStayedForMinDuration: boolean;
  totalStayDays: number;
  minStayDuration: number;
  presenceProgress: number;
  isTokensComplete: boolean;
  isVouched: boolean;
  hasNoReports: boolean;
  vouchCount: number;
  minVouches: number;
  isSpaceHostVouchRequired?: boolean;
  tokensProgress: number;
  tokensCard: ReactNode;
  showEligibilityQuests?: boolean;
}

const CitizenQuests = ({
  hasStayedForMinDuration,
  totalStayDays,
  minStayDuration,
  presenceProgress,
  isTokensComplete,
  isVouched,
  hasNoReports,
  vouchCount,
  minVouches,
  isSpaceHostVouchRequired,
  tokensProgress,
  tokensCard,
  showEligibilityQuests = true,
}: Props) => {
  const t = useTranslations();
  const { DISCORD_URL } = useConfig();

  // Tokens and vouching can happen in parallel — only presence gates vouching.
  const isVouchLocked = !hasStayedForMinDuration;
  const vouchProgress = isVouched
    ? 1
    : minVouches <= 0
    ? 1
    : Math.min(1, vouchCount / minVouches);

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${
        showEligibilityQuests ? 'sm:grid-cols-2' : ''
      }`}
    >
      {showEligibilityQuests && (
        <QuestCard
          icon="🌿"
          title={t('subscriptions_citizen_quest_presence_title')}
          tag={t('subscriptions_citizen_quest_presence_tag')}
          isComplete={hasStayedForMinDuration}
          progress={presenceProgress}
        >
          <p className="mb-1 text-sm font-bold">
            {t('subscriptions_citizen_presence_progress', {
              nights: totalStayDays,
              required: minStayDuration,
            })}
          </p>
          <p className="mb-3 text-sm text-gray-600">
            {t('subscriptions_citizen_stayed_for_min_duration', {
              var: minStayDuration,
            })}
          </p>
          {hasStayedForMinDuration ? (
            <p className="text-sm font-bold text-accent">
              ✓ {t('subscriptions_citizen_quest_complete')}
            </p>
          ) : (
            <LinkButton variant="secondary" href="/stay" target="_blank">
              {t('navigation_stay')}
            </LinkButton>
          )}
        </QuestCard>
      )}

      <QuestCard
        icon="🪙"
        title={t('subscriptions_citizen_quest_tokens_title')}
        tag={t('subscriptions_citizen_quest_tokens_tag')}
        isComplete={isTokensComplete}
        progress={tokensProgress}
      >
        {tokensCard}
      </QuestCard>

      {showEligibilityQuests && (
        <QuestCard
          icon="🤝"
          title={t('subscriptions_citizen_quest_vouch_title')}
          tag={t('subscriptions_citizen_quest_vouch_tag')}
          isComplete={isVouched}
          progress={vouchProgress}
          lockedMessage={
            isVouchLocked ? t('subscriptions_citizen_quest_locked') : null
          }
          className="sm:col-span-2"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isVouched
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              {isVouched && '✓ '}
              {t('subscriptions_citizen_vouched_by_n_members', {
                var: minVouches,
              })}
            </span>
            {isSpaceHostVouchRequired && (
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  isVouched
                    ? 'border-accent bg-accent-light text-accent'
                    : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              >
                {isVouched && '✓ '}
                {t('subscriptions_citizen_space_host_vouch_required')}
              </span>
            )}
          </div>
          {isVouched ? (
            <p className="text-sm font-bold text-accent">
              ✓ {t('subscriptions_citizen_quest_complete')}
            </p>
          ) : (
            !isVouchLocked &&
            DISCORD_URL && (
              <p className="text-sm text-gray-600">
                {t('subscriptions_citizen_introduce_yourself_in_discord')}{' '}
                <Link
                  className="text-primary underline"
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {DISCORD_URL}
                </Link>
              </p>
            )
          )}
        </QuestCard>
      )}

      {showEligibilityQuests && !hasNoReports && (
        <QuestCard
          icon="🛡️"
          title={t('subscriptions_citizen_quest_reports_title')}
          tag={t('subscriptions_citizen_quest_reports_tag')}
          isComplete={false}
          progress={0}
          className="sm:col-span-2"
        >
          <p className="text-sm text-gray-600">
            {t('subscriptions_citizen_report_mistake')}{' '}
            <a
              className="text-primary underline"
              href="mailto:space@traditionaldreamfactory.com"
            >
              space@traditionaldreamfactory.com
            </a>
          </p>
        </QuestCard>
      )}
    </div>
  );
};

export default CitizenQuests;
