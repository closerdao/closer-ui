import { FC, useState } from 'react';

import { Check, Copy, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  BETA_FEATURES,
  FEATURE_FLAG_BY_CONFIG,
  isConfigUnlockedByEnv,
} from '../../../constants/featureFlags';
import { FIRST_STEPS_FEATURES } from '../../../constants/firstSteps';

/**
 * One card per feature: what it does, and a switch.
 *
 * The switch writes the live `enabled` flag. It is not the whole gate — a
 * feature also needs its build-time `NEXT_PUBLIC_FEATURE_*` env var — so a
 * feature whose env flag is missing renders locked with the variable to set
 * rather than a toggle that would appear to work and change nothing. That is
 * the same bargain `pages/admin/config.tsx` strikes, and breaking it here would
 * be the most confusing thing this page could do.
 */

export interface FeaturesStepProps {
  /** Live `enabled` value per slug, including ones not yet saved. */
  enabledBySlug: Record<string, boolean | undefined>;
  onToggle: (slug: string, enabled: boolean) => void;
  isSaving: boolean;
  savingSlug?: string | null;
}

const FeaturesStep: FC<FeaturesStepProps> = ({
  enabledBySlug,
  onToggle,
  isSaving,
  savingSlug,
}) => {
  const t = useTranslations();
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null);

  const copyFlag = async (flag: string) => {
    try {
      await navigator.clipboard.writeText(`${flag}=true`);
      setCopiedFlag(flag);
      window.setTimeout(() => setCopiedFlag(null), 2000);
    } catch {
      // Clipboard access can be refused; the variable is on screen either way.
    }
  };

  const unlocked = FIRST_STEPS_FEATURES.filter((feature) =>
    isConfigUnlockedByEnv(feature.slug),
  );
  const locked = FIRST_STEPS_FEATURES.filter(
    (feature) => !isConfigUnlockedByEnv(feature.slug),
  );

  return (
    <>
      <ul className="flex flex-col gap-3">
        {unlocked.map((feature) => {
          const isEnabled = enabledBySlug[feature.slug] === true;
          const isBeta = BETA_FEATURES.includes(feature.slug);

          return (
            <li
              key={feature.slug}
              className="flex items-start justify-between gap-4 rounded-md border border-neutral-dark p-4"
            >
              <div>
                <p className="flex items-center gap-2 font-bold">
                  {t(feature.labelKey)}
                  {isBeta && (
                    <span className="rounded-full bg-neutral px-2 py-0.5 text-xs uppercase">
                      {t('first_steps_feature_beta')}
                    </span>
                  )}
                </p>
                <p className="text-sm">{feature.explanation}</p>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={isEnabled}
                  disabled={isSaving}
                  aria-label={t(feature.labelKey)}
                  data-testid={`first-steps-feature-${feature.slug}`}
                  onChange={(event) =>
                    onToggle(feature.slug, event.target.checked)
                  }
                />
                <span className="text-sm">
                  {savingSlug === feature.slug
                    ? t('first_steps_saving')
                    : isEnabled
                    ? t('first_steps_feature_on')
                    : t('first_steps_feature_off')}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {locked.length > 0 && (
        <div className="rounded-md border border-dashed border-neutral-dark p-4">
          <p className="mb-1 flex items-center gap-2 font-bold">
            <Lock size={16} /> {t('first_steps_features_locked_title')}
          </p>
          <p className="mb-4 text-sm">
            {t('first_steps_features_locked_description')}
          </p>

          <ul className="flex flex-col gap-2">
            {locked.map((feature) => {
              const flag = FEATURE_FLAG_BY_CONFIG[feature.slug];
              return (
                <li
                  key={feature.slug}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>{t(feature.labelKey)}</span>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md bg-neutral px-2 py-1 font-mono text-xs"
                    onClick={() => copyFlag(flag)}
                    title={t('first_steps_copy_flag')}
                  >
                    {flag}=true
                    {copiedFlag === flag ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};

export default FeaturesStep;
