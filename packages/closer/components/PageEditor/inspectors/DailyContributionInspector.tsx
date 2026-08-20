import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Input, Textarea } from '../../ui';
import PageEditorCheckbox from '../PageEditorCheckbox';
import type {
  BookingConfig,
  CloserCurrencies,
  FoodOption,
} from '../../../types';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { resolveVolunteerDailyRates } from '../../../utils/dailyContribution.helpers';
import { priceFormat } from '../../../utils/helpers';

import type { BlockInspectorFormProps } from './types';

const formatAmount = (value: number, currency: string) => {
  try {
    return priceFormat(value, currency as CloserCurrencies);
  } catch {
    return `${value} ${currency}`;
  }
};

const DailyContributionInspector = ({
  data,
  onChange,
}: BlockInspectorFormProps) => {
  const t = useTranslations();
  const settings = (data.settings as Record<string, unknown>) ?? {};
  const content = (data.content as Record<string, unknown>) ?? {};
  const bookingConfig = getCachedConfig('booking') as BookingConfig | null;
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [isLoadingFood, setIsLoadingFood] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadFood = async () => {
      setIsLoadingFood(true);
      try {
        const foodRes = await api.get('/food').catch(() => null);
        const results: FoodOption[] = foodRes?.data?.results ?? [];
        if (!cancelled) {
          setFoodOptions(results);
        }
      } catch {
        if (!cancelled) {
          setFoodOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingFood(false);
        }
      }
    };
    void loadFood();
    return () => {
      cancelled = true;
    };
  }, []);

  const rates = resolveVolunteerDailyRates({
    bookingConfig,
    foodOptions,
    bookingContext: 'volunteer',
  });

  const patch = (next: Record<string, unknown>) =>
    onChange({ ...data, ...next });

  const patchContent = (key: string, value: string) =>
    patch({ settings, content: { ...content, [key]: value } });

  const patchSettings = (key: string, value: unknown) =>
    patch({ settings: { ...settings, [key]: value }, content });

  const showAccommodation = settings.showAccommodation !== false;

  const foodValue = isLoadingFood
    ? '…'
    : rates.isFoodSelection
      ? t('daily_contribution_selection')
      : rates.foodRate == null
        ? '—'
        : formatAmount(rates.foodRate, rates.currency);

  const utilityValue =
    rates.utilityRate == null
      ? '—'
      : formatAmount(rates.utilityRate, rates.currency);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-gray-100 bg-neutral-light p-3 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t('pages_editor_daily_contribution_live_rates')}
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">{t('daily_contribution_food')}</span>
            <span className="font-medium text-gray-900 text-right">
              {foodValue}
              {rates.isFoodSelection && rates.foodMinRate != null ? (
                <span className="block text-xs font-normal text-gray-500">
                  {rates.foodMinRate === rates.foodMaxRate
                    ? formatAmount(rates.foodMinRate, rates.currency)
                    : `${formatAmount(rates.foodMinRate, rates.currency)} – ${formatAmount(
                        rates.foodMaxRate ?? rates.foodMinRate,
                        rates.currency,
                      )}`}
                </span>
              ) : null}
            </span>
          </div>
          {!isLoadingFood && rates.foodOptions.length > 0 ? (
            <ul className="m-0 list-disc pl-4 text-xs text-gray-500">
              {rates.foodOptions.map((option) => (
                <li key={option._id}>
                  {option.name}: {formatAmount(option.price, rates.currency)}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">
              {t('daily_contribution_utilities')}
            </span>
            <span className="font-medium text-gray-900">{utilityValue}</span>
          </div>
          {showAccommodation ? (
            <div className="flex justify-between gap-3">
              <span className="text-gray-600">
                {t('daily_contribution_accommodation')}
              </span>
              <span className="font-medium text-gray-900">
                {t('daily_contribution_free')}
              </span>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {t.rich('pages_editor_daily_contribution_utility_note', {
            link: (chunks) => (
              <Link
                href="/dashboard/admin/config"
                className="text-accent font-medium underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          {t('pages_editor_daily_contribution_food_note')}
        </p>
      </div>

      <PageEditorCheckbox
        checked={showAccommodation}
        onChange={(checked) => patchSettings('showAccommodation', checked)}
      >
        {t('pages_editor_field_show_accommodation')}
      </PageEditorCheckbox>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_title')}
        </label>
        <Input
          value={String(content.title ?? '')}
          onChange={(e) => patchContent('title', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_description')}
        </label>
        <Textarea
          rows={3}
          value={String(content.description ?? '')}
          onChange={(e) => patchContent('description', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_food_label')}
        </label>
        <Input
          value={String(content.foodLabel ?? '')}
          onChange={(e) => patchContent('foodLabel', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_utilities_label')}
        </label>
        <Input
          value={String(content.utilitiesLabel ?? '')}
          onChange={(e) => patchContent('utilitiesLabel', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('pages_editor_field_accommodation_label')}
        </label>
        <Input
          value={String(content.accommodationLabel ?? '')}
          onChange={(e) => patchContent('accommodationLabel', e.target.value)}
        />
      </div>
    </div>
  );
};

export default DailyContributionInspector;
