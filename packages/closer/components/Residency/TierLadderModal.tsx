import { FC } from 'react';

import { useTranslations } from 'next-intl';

import { PresenceTier, ResidencyParams } from '../../types/residency';
import { clamp } from '../../utils/residency.helpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui';

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  params: ResidencyParams;
  presence: number;
  currentTier: PresenceTier;
}

/** Shades the graded bar walks through, lightest floor to darkest ceiling. */
const TIER_BAR_OPACITY = [0.2, 0.35, 0.55, 0.8, 1];

const TierLadderModal: FC<Props> = ({
  isOpen,
  onOpenChange,
  params,
  presence,
  currentTier,
}) => {
  const t = useTranslations();
  const { presenceTiers, presenceScaleMax } = params;
  const youPercent = clamp(presence / presenceScaleMax, 0, 1) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('residency_tiers_modal_title')}</DialogTitle>
          <DialogDescription>
            {t('residency_tiers_modal_description', {
              max: presenceScaleMax,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* graded ladder, 0 → presenceScaleMax */}
        <div className="relative mb-6 h-12">
          <div className="absolute left-0 right-0 top-[18px] flex h-2.5 overflow-hidden rounded-full">
            {presenceTiers.map((tier, index) => {
              const next = presenceTiers[index + 1];
              const ceiling = Math.min(
                next ? next.minPresence : presenceScaleMax,
                presenceScaleMax,
              );
              const width =
                ((ceiling - tier.minPresence) / presenceScaleMax) * 100;
              return (
                <div
                  key={tier.label}
                  title={tier.label}
                  className="bg-accent"
                  style={{
                    width: `${Math.max(0, width)}%`,
                    opacity:
                      TIER_BAR_OPACITY[
                        Math.min(index, TIER_BAR_OPACITY.length - 1)
                      ],
                  }}
                />
              );
            })}
          </div>
          {presenceTiers.map((tier) => (
            <div
              key={tier.label}
              aria-hidden
              className="absolute top-[32px] text-[9px] font-semibold text-complimentary-light"
              style={{
                left: `${(tier.minPresence / presenceScaleMax) * 100}%`,
              }}
            >
              {tier.minPresence}
            </div>
          ))}
          <div
            className="absolute top-0 -translate-x-1/2 text-center"
            style={{ left: `${youPercent}%` }}
          >
            <div className="whitespace-nowrap text-[9px] font-bold text-accent">
              {t('residency_tiers_you_marker', { presence })}
            </div>
            <div className="mx-auto mt-px h-3.5 w-0.5 bg-accent" />
          </div>
        </div>

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {presenceTiers.map((tier, index) => {
            const next = presenceTiers[index + 1];
            const isCurrent = tier.label === currentTier.label;
            const isReached = presence >= tier.minPresence;
            return (
              <li
                key={tier.label}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  isCurrent
                    ? 'border-accent bg-accent-light'
                    : 'border-line bg-dominant'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    isReached ? 'bg-accent' : 'bg-line'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm font-bold text-complimentary-core">
                    {tier.label}{' '}
                    <span className="text-xs font-medium text-complimentary-light">
                      ·{' '}
                      {next
                        ? `${tier.minPresence}–${next.minPresence - 1}`
                        : `${tier.minPresence}+`}{' '}
                      $Presence
                    </span>
                  </p>
                  {tier.unlocks && (
                    <p className="m-0 text-xs text-complimentary-light">
                      {t('residency_tiers_unlocks', { unlocks: tier.unlocks })}
                    </p>
                  )}
                </div>
                {isReached && (
                  <span className="whitespace-nowrap text-xs font-semibold text-accent">
                    {t('residency_tiers_reached')}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default TierLadderModal;
