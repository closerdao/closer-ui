import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { SubscriptionPlan } from '../../types/subscriptions';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { parseSubscriptionPerks } from '../../utils/subscriptionPerks';
import { Heading } from '../ui';

interface SubscriptionComparisonTableProps {
  plans: SubscriptionPlan[];
  currency: string;
  activePriceId?: string;
  getCtaLabel: (plan: SubscriptionPlan) => string;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

const normalizePerkTitle = (title: string) =>
  title.replace(/<[^>]*>/g, '').trim().toLowerCase();

const SubscriptionComparisonTable = ({
  plans,
  currency,
  activePriceId,
  getCtaLabel,
  onSubscribe,
}: SubscriptionComparisonTableProps) => {
  const t = useTranslations();

  const perkRows = useMemo(() => {
    const titles: string[] = [];
    const seen = new Set<string>();

    plans.forEach((plan) => {
      parseSubscriptionPerks(plan.perks).forEach((perk) => {
        const key = normalizePerkTitle(perk.title);
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        titles.push(perk.title.replace(/<[^>]*>/g, '').trim());
      });
    });

    return titles;
  }, [plans]);

  const planHasPerk = (plan: SubscriptionPlan, perkTitle: string) => {
    const target = normalizePerkTitle(perkTitle);
    return parseSubscriptionPerks(plan.perks).some(
      (perk) => normalizePerkTitle(perk.title) === target,
    );
  };

  return (
    <section className="flex flex-col gap-4 text-foreground">
      <div className="text-center flex flex-col gap-2">
        <Heading level={2} className="text-2xl md:text-3xl">
          {t('subscriptions_compare_title')}
        </Heading>
        <p className="text-base text-foreground/75 max-w-2xl mx-auto">
          {t('subscriptions_compare_intro')}
        </p>
      </div>

      <div className="overflow-x-auto border border-line rounded-2xl bg-neutral-light">
        <table className="w-full min-w-[640px] border-collapse text-sm md:text-base">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left p-4 font-medium text-foreground/70 w-[28%]">
                {t('subscriptions_compare_features')}
              </th>
              {plans.map((plan) => (
                <th key={plan.slug} className="p-4 text-center align-bottom">
                  <div className="flex flex-col gap-1 items-center">
                    {plan.emoji ? <span className="text-2xl">{plan.emoji}</span> : null}
                    <span className="font-semibold text-lg">{plan.title}</span>
                    <span className="text-sm text-foreground/70 line-clamp-2 max-w-[12rem]">
                      {plan.description}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line bg-accent-light/40">
              <td className="p-4 font-medium">
                {t('subscriptions_compare_price')}
              </td>
              {plans.map((plan) => (
                <td key={`${plan.slug}-price`} className="p-4 text-center">
                  <p className="text-2xl font-semibold">
                    {formatIsoFiatAmount(Number(plan.price || 0), currency)}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {t('subscriptions_summary_per_month')}
                  </p>
                </td>
              ))}
            </tr>
            {perkRows.map((perkTitle) => (
              <tr key={perkTitle} className="border-b border-line">
                <td className="p-4">{perkTitle}</td>
                {plans.map((plan) => (
                  <td
                    key={`${plan.slug}-${perkTitle}`}
                    className="p-4 text-center"
                  >
                    {planHasPerk(plan, perkTitle) ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-accent-light text-accent-dark items-center justify-center text-xs">
                        ✓
                      </span>
                    ) : (
                      <span className="text-foreground/40">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4" />
              {plans.map((plan) => {
                const isActive = Boolean(
                  activePriceId &&
                    (plan.priceId === activePriceId ||
                      plan.priceId?.includes(activePriceId)),
                );
                return (
                  <td key={`${plan.slug}-cta`} className="p-4 text-center">
                    <button
                      className={`text-sm px-4 py-2 whitespace-nowrap ${
                        isActive ? 'btn' : 'btn-primary'
                      }`}
                      onClick={() => onSubscribe(plan)}
                    >
                      {getCtaLabel(plan)}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-center text-foreground/70">
        {t('subscriptions_cancel_anytime')}
      </p>
    </section>
  );
};

export default SubscriptionComparisonTable;
