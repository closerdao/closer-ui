import React from 'react';

import dayjs from 'dayjs';
import { useFormatter, useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useCitizenQuests } from '../../hooks/useCitizenQuests';
import { resolveBlockText } from '../../utils/blockI18n';
import CitizenQuestsPanel from '../CitizenQuests/CitizenQuestsPanel';
import { Heading, LinkButton } from '../ui';

interface Props {
  settings?: {
    showBalances?: boolean;
  };
  content?: {
    title?: string;
    description?: string;
    ctaText?: string;
    ctaLink?: string;
    items?: string[];
  };
}

const DEFAULT_CTA_LINK = '/citizenship/why';
const CONTINUE_LINK = '/citizenship/validation';

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
    {children}
  </div>
);

const BalanceTile = ({ label, value }: { label: string; value: number }) => {
  // Format for the language the page is in. `toLocaleString` without a locale
  // follows whatever machine is rendering, so the same balance came out `7.5`
  // or `7,5` depending on the reader's OS rather than on the chosen locale.
  const format = useFormatter();
  return (
    <div className="flex-1 rounded-xl bg-accent-light/40 p-4">
      <p className="text-2xl font-bold text-accent">
        {format.number(value, { maximumFractionDigits: 2 })}
      </p>
      <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
};

/**
 * Shows where the visitor stands on the citizenship journey: already a citizen,
 * an application in progress (the quests from
 * `/citizenship/validation`), or an invitation to become one.
 */
const CustomCitizenshipStatus = ({ settings, content }: Props) => {
  const t = useTranslations();
  const { user } = useAuth();
  const quests = useCitizenQuests();

  const pick = (raw: string | undefined, fallback: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : fallback;

  const isCitizen = Boolean(
    user?.roles?.includes('member') || user?.roles?.includes('citizen'),
  );

  const hasApplicationInProgress =
    !isCitizen &&
    Boolean(user) &&
    Boolean(
      user?.citizenship?.why ||
        user?.citizenship?.status ||
        user?.citizenship?.appliedAt,
    );

  const section = (children: React.ReactNode) => (
    <section className="py-12 md:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">{children}</div>
    </section>
  );

  if (isCitizen) {
    const since = user?.citizenship?.createdAt || user?.citizenship?.appliedAt;
    const sinceLabel = since ? dayjs(since).format('MMMM YYYY') : null;
    const showBalances = settings?.showBalances !== false;
    // $Presence is read straight off the chain when the user's own wallet is
    // connected; otherwise we fall back to the balance cached on the user, which
    // can lag behind. There is no on-chain read for $Sweat, so it is always cached.
    const presence = quests.hasLiveWalletBalances
      ? quests.proofOfPresence
      : toNumber(user?.stats?.wallet?.presence ?? user?.presence ?? 0);
    const sweat = toNumber(user?.stats?.wallet?.sweat ?? 0);

    return section(
      <Card>
        <Heading level={2} className="text-2xl font-normal text-gray-900">
          {pick(content?.title, t('citizenship_status_citizen_title'))}
        </Heading>
        <p className="text-base leading-relaxed text-gray-600">
          {sinceLabel
            ? t('citizenship_status_citizen_since', { date: sinceLabel })
            : t('citizenship_status_citizen_description')}
        </p>
        {showBalances && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <BalanceTile
                label={t('citizenship_status_presence_label')}
                value={presence}
              />
              <BalanceTile
                label={t('citizenship_status_sweat_label')}
                value={sweat}
              />
            </div>
            <p className="text-xs text-gray-500">
              {quests.hasLiveWalletBalances
                ? t('citizenship_status_balances_live_note')
                : t('citizenship_status_balances_cached_note')}
            </p>
          </div>
        )}
      </Card>,
    );
  }

  if (hasApplicationInProgress) {
    return section(
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Heading level={2} className="text-2xl font-normal text-gray-900">
            {t('subscriptions_citizen_quests_title')}
          </Heading>
          <p className="text-sm text-gray-600">
            {t('subscriptions_citizen_quests_subtitle')}
          </p>
        </div>
        <CitizenQuestsPanel quests={quests} interactive={false} />
        <div>
          <LinkButton href={CONTINUE_LINK} variant="primary">
            {t('citizenship_status_continue_application')}
          </LinkButton>
        </div>
      </div>,
    );
  }

  const benefits =
    content?.items && content.items.length > 0
      ? content.items
      : [
          t('subscriptions_citizen_reason_home_description'),
          t('subscriptions_citizen_reason_voice_description'),
          t('subscriptions_citizen_reason_stake_description'),
        ];

  return section(
    <Card>
      <Heading level={2} className="text-2xl font-normal text-gray-900">
        {pick(content?.title, t('citizenship_status_cta_title'))}
      </Heading>
      <p className="text-base leading-relaxed text-gray-600">
        {pick(content?.description, t('citizenship_status_cta_description'))}
      </p>
      <ul className="flex flex-col gap-2">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex gap-2 text-sm text-gray-700">
            <span className="text-accent">✓</span>
            <span>{resolveBlockText(benefit, t)}</span>
          </li>
        ))}
      </ul>
      <div>
        <LinkButton
          href={content?.ctaLink?.trim() || DEFAULT_CTA_LINK}
          variant="primary"
        >
          {pick(content?.ctaText, t('subscriptions_citizen_become_citizen'))}
        </LinkButton>
      </div>
    </Card>,
  );
};

export default CustomCitizenshipStatus;
