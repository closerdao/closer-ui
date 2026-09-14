import React, { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import {
  TOKEN_ONBOARDING_TOTAL_CARROTS,
  getTokenOnboardingQuests,
} from '../../constants/tokenOnboardingQuests';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import type { GeneralConfig } from '../../types';
import { userHasLinkedWallet } from '../../utils/auth.helpers';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getGasTokenDisplay } from '../../utils/config.utils';
import {
  carrotsEarned,
  formatCarrots,
  isOnboardingComplete,
  parseOnboardingProgress,
} from '../../utils/tokenOnboarding.helpers';
import {
  TokenPromoShell,
  usePromoText,
  type TokenPromoContent,
} from './CustomTokenPagePromo';

interface Props {
  settings?: Record<string, unknown>;
  content?: TokenPromoContent;
}

const progressStorageKey = (userId: string) =>
  `token-onboarding-progress-${userId}`;

const humanNetworkName = (name: string) =>
  name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/**
 * Onboarding promo that knows where the member actually is: fresh visitors get
 * the pitch, members with a linked wallet get a head-start message, members
 * mid-flow get their quest/carrot progress, and finished members see it as
 * completed. Progress reads the same two stores the onboarding page writes:
 * `user.settings.token_onboarding_progress` and the per-user localStorage key.
 */
const CustomTokenOnboardingPromo = ({ content }: Props) => {
  const t = useTranslations();
  const text = usePromoText();
  const { user } = useAuth();

  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const platformName =
    generalConfig?.platformName ||
    (defaultConfig as { platformName?: string })?.platformName ||
    '';
  const gasToken = getGasTokenDisplay(defaultConfig);
  const semanticUrl =
    (generalConfig as { semanticUrl?: string } | null)?.semanticUrl ||
    (defaultConfig as { semanticUrl?: string })?.semanticUrl ||
    '';

  const quests = useMemo(
    () =>
      getTokenOnboardingQuests({
        tokenSymbol: blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol,
        platformName,
        networkName: humanNetworkName(blockchainConfig.BLOCKCHAIN_NAME),
        gasToken,
        semanticUrl,
        canConnectWallet:
          process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true',
      }),
    [platformName, gasToken, semanticUrl],
  );

  // Read progress after mount only — SSR and the hydration pass render the
  // signed-out pitch, then the member's real status fills in.
  const [completed, setCompleted] = useState<string[]>([]);
  useEffect(() => {
    if (!user?._id) {
      setCompleted([]);
      return;
    }
    const stored =
      typeof window === 'undefined'
        ? null
        : window.localStorage.getItem(progressStorageKey(user._id));
    const local = parseOnboardingProgress(stored, quests).completed;
    const remote = parseOnboardingProgress(
      (user.settings as { token_onboarding_progress?: unknown } | undefined)
        ?.token_onboarding_progress,
      quests,
    ).completed;
    setCompleted(
      quests
        .map((quest) => quest.id)
        .filter((id) => local.includes(id) || remote.includes(id)),
    );
  }, [user?._id, user?.settings, quests]);

  const isComplete = completed.length > 0 && isOnboardingComplete(completed, quests);
  const isInProgress = completed.length > 0 && !isComplete;
  const hasWallet = userHasLinkedWallet(user);
  const carrots = carrotsEarned(completed, quests);
  const link = content?.ctaLink?.trim() || '/token/onboarding';

  const items = (content?.items ?? [])
    .map((item) => text(item?.text))
    .filter(Boolean);

  if (isComplete) {
    return (
      <TokenPromoShell
        eyebrow={text(content?.eyebrow)}
        title={t('token_promo_onboarding_completed_title')}
        ctaText={t('token_promo_onboarding_cta_completed')}
        ctaLink={link}
      >
        <p className="flex items-center gap-2 text-base text-gray-700">
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white text-sm"
          >
            ✓
          </span>
          {t('token_promo_onboarding_completed_message', {
            carrots: formatCarrots(carrots),
          })}
        </p>
      </TokenPromoShell>
    );
  }

  if (isInProgress) {
    const progressPercent = Math.round(
      (completed.length / quests.length) * 100,
    );
    return (
      <TokenPromoShell
        eyebrow={text(content?.eyebrow)}
        title={t('token_promo_onboarding_in_progress_title')}
        description={t('token_promo_onboarding_in_progress_message', {
          completed: completed.length,
          total: quests.length,
          carrots: formatCarrots(carrots),
          totalCarrots: formatCarrots(TOKEN_ONBOARDING_TOTAL_CARROTS),
        })}
        ctaText={t('token_promo_onboarding_cta_continue')}
        ctaLink={link}
      >
        <div
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full rounded-full bg-gray-100"
        >
          <div
            className="h-2 rounded-full bg-accent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </TokenPromoShell>
    );
  }

  return (
    <TokenPromoShell
      eyebrow={text(content?.eyebrow)}
      title={text(content?.title)}
      description={
        hasWallet
          ? t('token_promo_onboarding_wallet_ready_message')
          : text(content?.description)
      }
      ctaText={text(content?.ctaText)}
      ctaLink={link}
    >
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 text-base text-gray-700"
            >
              <span aria-hidden="true" className="text-accent mt-0.5">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </TokenPromoShell>
  );
};

export default CustomTokenOnboardingPromo;
