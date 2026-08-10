import { useTranslations } from 'next-intl';

import { SubscriptionPlan } from '../../types/subscriptions';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { parseSubscriptionPerks } from '../../utils/subscriptionPerks';
import { sanitizeSubscriptionPerkHtml } from '../../utils/sanitizeSubscriptionPerkHtml';
import { Heading } from '../ui';

interface SubscriptionEditorialProps {
  plan: SubscriptionPlan;
  currency: string;
  ctaLabel: string;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

const SubscriptionEditorial = ({
  plan,
  currency,
  ctaLabel,
  onSubscribe,
}: SubscriptionEditorialProps) => {
  const t = useTranslations();
  const perks = parseSubscriptionPerks(plan.perks);
  const formattedPrice = formatIsoFiatAmount(Number(plan.price || 0), currency);

  return (
    <section className="bg-neutral-light rounded-2xl border border-line p-5 md:p-7 text-foreground flex flex-col md:flex-row gap-5 md:gap-7">
      <div className="flex-1 flex flex-col gap-4">
        <span className="inline-flex w-fit rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-foreground">
          {t('subscriptions_single_plan_badge')}
        </span>
        <Heading level={2} className="text-2xl md:text-3xl">
          {plan.title}
        </Heading>
        <p className="text-lg leading-relaxed max-w-2xl">{plan.description}</p>
        <div className="flex flex-col gap-3">
          {perks.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-accent-light text-accent-dark flex items-center justify-center mt-1 text-xs">
                ✓
              </span>
              <div className="flex flex-col gap-1">
                {perk.title.includes('<') ? (
                  <span
                    className="text-base leading-relaxed font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeSubscriptionPerkHtml(perk.title),
                    }}
                  />
                ) : (
                  <p className="text-base leading-relaxed font-semibold">
                    {perk.title}
                  </p>
                )}
                {perk.description ? (
                  perk.description.includes('<') ? (
                    <span
                      className="text-sm text-foreground/75 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSubscriptionPerkHtml(perk.description),
                      }}
                    />
                  ) : (
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      {perk.description}
                    </p>
                  )
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-px bg-line hidden md:block" />

      <div className="md:w-[220px] flex flex-col items-center justify-center gap-3">
        <p className="text-4xl md:text-5xl font-semibold leading-none">
          {formattedPrice}
        </p>
        <p className="text-base text-center">
          {t('subscriptions_summary_per_month')}
        </p>
        <button
          className="btn-primary text-sm px-5 py-2 whitespace-nowrap"
          onClick={() => onSubscribe(plan)}
        >
          {ctaLabel}
        </button>
        <p className="text-sm text-foreground/70">
          {t('subscriptions_cancel_anytime')}
        </p>
      </div>
    </section>
  );
};

export default SubscriptionEditorial;
