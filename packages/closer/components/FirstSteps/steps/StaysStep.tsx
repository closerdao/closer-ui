import Link from 'next/link';

import { FC } from 'react';

import { Check, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { FirstStepDefinition } from '../../../constants/firstSteps';
import ConfigFields from '../ConfigFields';
import SaveBar from '../SaveBar';

/**
 * House rules, then somewhere to sleep.
 *
 * A stay page with no listing is worse than no stay page: it renders, accepts a
 * search and returns nothing, which reads as broken. So this step is not done
 * until at least one listing exists — and, when the village has switched food
 * on, at least one food option too, since booking prices food in and finds
 * nothing to price.
 */

export interface StaysStepProps {
  step: FirstStepDefinition;
  value: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  listingCount: number;
  foodCount: number;
  isFoodEnabled: boolean;
}

const StaysStep: FC<StaysStepProps> = ({
  step,
  value,
  onChange,
  onSave,
  isSaving,
  isDirty,
  listingCount,
  foodCount,
  isFoodEnabled,
}) => {
  const t = useTranslations();

  const inventory = [
    {
      id: 'listings',
      count: listingCount,
      titleKey: 'first_steps_stays_listings',
      hint: 'first_steps_stays_listings_hint',
      href: '/listings/create',
      createKey: 'first_steps_stays_create_listing',
      show: true,
    },
    {
      id: 'food',
      count: foodCount,
      titleKey: 'first_steps_stays_food',
      hint: 'first_steps_stays_food_hint',
      href: '/food/create',
      createKey: 'first_steps_stays_create_food',
      show: isFoodEnabled,
    },
  ].filter((row) => row.show);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t('first_steps_stays_rules')}</h2>
        <ConfigFields
          slug={step.fields!.slug}
          keys={step.fields!.keys}
          value={value}
          onChange={onChange}
          disabled={isSaving}
        />
        <SaveBar onSave={onSave} isSaving={isSaving} isDirty={isDirty} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">
          {t('first_steps_stays_inventory')}
        </h2>

        {inventory.map((row) => (
          <div
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-dark p-4"
            data-testid={`first-steps-inventory-${row.id}`}
          >
            <div>
              <p className="flex items-center gap-2 font-bold">
                {t(row.titleKey)}
                {row.count > 0 && (
                  <span className="flex items-center gap-1 text-sm font-normal">
                    <Check size={14} />
                    {t('first_steps_stays_count', { count: row.count })}
                  </span>
                )}
              </p>
              <p className="text-sm">{t(row.hint)}</p>
            </div>

            <Link
              href={`${row.href}?from=first-steps`}
              className="flex items-center gap-1.5 text-sm underline"
            >
              {t(row.createKey)}
              <ExternalLink size={14} />
            </Link>
          </div>
        ))}
      </section>
    </>
  );
};

export default StaysStep;
