import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Heading } from '../ui';
import type { BookingConfig, FoodOption } from '../../types';
import api from '../../utils/api';
import { resolveBlockText } from '../../utils/blockI18n';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { resolveVolunteerDailyRates } from '../../utils/dailyContribution.helpers';
import { priceFormat } from '../../utils/helpers';

interface Props {
  settings?: {
    showAccommodation?: boolean;
  };
  content?: {
    title?: string;
    description?: string;
    foodLabel?: string;
    utilitiesLabel?: string;
    accommodationLabel?: string;
    totalLabel?: string;
    freeLabel?: string;
    perDayLabel?: string;
    selectionLabel?: string;
  };
}

const formatAmount = (value: number, currency: string) => {
  try {
    return priceFormat(value, currency);
  } catch {
    return `${value} ${currency}`;
  }
};

const CustomDailyContribution = ({ settings, content }: Props) => {
  const t = useTranslations();
  const bookingConfig = getCachedConfig('booking') as BookingConfig | null;
  const showAccommodation = settings?.showAccommodation !== false;
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

  const pick = (raw: string | undefined, fallbackKey: string) =>
    raw != null && String(raw).trim() !== ''
      ? resolveBlockText(raw, t)
      : resolveBlockText(`_i18n_${fallbackKey}`, t);

  const rates = resolveVolunteerDailyRates({
    bookingConfig,
    foodOptions,
    bookingContext: 'volunteer',
  });

  const title = pick(content?.title, 'daily_contribution_title');
  const description = pick(
    content?.description,
    'daily_contribution_description',
  );
  const foodLabel = pick(content?.foodLabel, 'daily_contribution_food');
  const utilitiesLabel = pick(
    content?.utilitiesLabel,
    'daily_contribution_utilities',
  );
  const accommodationLabel = pick(
    content?.accommodationLabel,
    'daily_contribution_accommodation',
  );
  const totalLabel = pick(content?.totalLabel, 'daily_contribution_total');
  const freeLabel = pick(content?.freeLabel, 'daily_contribution_free');
  const perDayLabel = pick(content?.perDayLabel, 'daily_contribution_per_day');
  const selectionLabel = pick(
    content?.selectionLabel,
    'daily_contribution_selection',
  );

  const foodDisplay = isLoadingFood
    ? '—'
    : rates.isFoodSelection
      ? selectionLabel
      : rates.foodRate == null
        ? '—'
        : rates.foodRate === 0
          ? freeLabel
          : formatAmount(rates.foodRate, rates.currency);

  const foodHint =
    !isLoadingFood && rates.isFoodSelection && rates.foodMinRate != null
      ? rates.foodMinRate === rates.foodMaxRate
        ? formatAmount(rates.foodMinRate, rates.currency)
        : `${formatAmount(rates.foodMinRate, rates.currency)} – ${formatAmount(
            rates.foodMaxRate ?? rates.foodMinRate,
            rates.currency,
          )}`
      : null;

  const utilityDisplay =
    rates.utilityRate == null
      ? '—'
      : rates.utilityRate === 0
        ? freeLabel
        : formatAmount(rates.utilityRate, rates.currency);

  const items: {
    key: string;
    label: string;
    display: string;
    hint?: string | null;
  }[] = [
    {
      key: 'food',
      label: foodLabel,
      display: foodDisplay,
      hint: foodHint,
    },
    {
      key: 'utilities',
      label: utilitiesLabel,
      display: utilityDisplay,
    },
  ];

  if (showAccommodation) {
    items.push({
      key: 'accommodation',
      label: accommodationLabel,
      display: freeLabel,
    });
  }

  const canTotal =
    !isLoadingFood &&
    !rates.isFoodSelection &&
    rates.foodRate != null &&
    rates.utilityRate != null;
  const total = canTotal
    ? rates.foodRate +
      rates.utilityRate +
      (showAccommodation ? rates.accommodationRate : 0)
    : null;
  const fromTotal =
    !isLoadingFood &&
    rates.isFoodSelection &&
    rates.foodMinRate != null &&
    rates.utilityRate != null
      ? rates.foodMinRate +
        rates.utilityRate +
        (showAccommodation ? rates.accommodationRate : 0)
      : null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3 text-center max-w-2xl mx-auto">
          {title ? (
            <Heading
              level={2}
              className="text-2xl md:text-3xl font-normal text-gray-900"
            >
              {title}
            </Heading>
          ) : null}
          {description ? (
            <p className="text-base leading-relaxed text-gray-600">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={`grid gap-3 sm:gap-4 ${
            items.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-accent/10 bg-accent-light/40 px-5 py-6 text-center flex flex-col gap-2"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                {item.label}
              </p>
              <p className="text-2xl font-semibold text-accent">{item.display}</p>
              {item.hint ? (
                <p className="text-sm text-gray-600">{item.hint}</p>
              ) : (
                <p className="text-sm text-gray-600">{perDayLabel}</p>
              )}
            </div>
          ))}
        </div>

        {total != null ? (
          <p className="text-center text-sm font-semibold text-gray-800">
            {totalLabel}:{' '}
            <span className="text-accent">
              {formatAmount(total, rates.currency)}
            </span>{' '}
            {perDayLabel}
          </p>
        ) : null}
        {fromTotal != null ? (
          <p className="text-center text-sm font-semibold text-gray-800">
            {totalLabel}:{' '}
            <span className="text-accent">
              {t('daily_contribution_from', {
                amount: formatAmount(fromTotal, rates.currency),
              })}
            </span>{' '}
            {perDayLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default CustomDailyContribution;
