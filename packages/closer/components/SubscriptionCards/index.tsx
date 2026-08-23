import Image from 'next/image';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import { slugify } from '../../utils/common';
import { getCurrencySymbol } from '../../utils/helpers';
import { parseSubscriptionPerks } from '../../utils/subscriptionPerks';
import { sanitizeSubscriptionPerkHtml } from '../../utils/sanitizeSubscriptionPerkHtml';
import { filterPaidSubscriptionPlans, isFirstMonthFreePlan, normalizeSubscriptionBillingPeriod } from '../../utils/subscriptions.helpers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Heading from '../ui/Heading';

interface SubscriptionCardsProps {
  clickHandler: (priceId: string, hasVariants: boolean, slug: string) => void;
  userActivePlan?: SubscriptionPlan;
  validUntil?: Date;
  cancelledAt?: Date;
  currency: string;
  plans: SubscriptionPlan[];
}

const SubscriptionCards = ({
  clickHandler,
  userActivePlan,
  validUntil,
  cancelledAt,
  currency,
  plans,
}: SubscriptionCardsProps) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();

  const { APP_NAME } = useConfig();

  const filteredPlans = filterPaidSubscriptionPlans(plans).filter(
    (plan) => plan.available,
  );

  const getCtaText = (price: number, slug: string) => {
    if (!userActivePlan) {
      return t('subscriptions_subscribe_button');
    }

    if (slugify(userActivePlan?.title || '') === slug) {
      return t('subscriptions_manage_button');
    }

    if (price > (userActivePlan?.price || 0)) {
      return t('subscriptions_upgrade_button');
    }
    return t('subscriptions_manage_button');
  };

  const getSubscriptionInfoText = (plan: SubscriptionPlan) => {
    if (userActivePlan?.title === plan.title && validUntil && !cancelledAt) {
      return (
        <>
          {t('subscriptions_next_billing_date')}{' '}
          {dayjs(validUntil).format('DD/MM/YYYY')}
        </>
      );
    }
    if (userActivePlan?.title === plan.title && cancelledAt) {
      return (
        <>
          {t('subscriptions_cancelled')}{' '}
          {dayjs(cancelledAt).format('DD/MM/YYYY')}
        </>
      );
    }
    return null;
  };

  return (
    <>
      {filteredPlans.map((plan, i) => (
        <Card key={plan.slug || plan.title} className="w-full p-8">
          <div className="flex flex-col md:flex-row gap-6 justify-between">
            {(APP_NAME && plan.slug
              ? ['tdf'].includes(APP_NAME.toLowerCase())
              : false) && (
              <Image
                alt={plan.title || ''}
                src={`/images/subscriptions/${plan.slug}.png`}
                width={200}
                height={320}
              />
            )}
            <div className="w-[90%] md:w-[60%]">
              <Heading level={2} className="border-b-0 mb-6">
                {plan.title}
              </Heading>
              <div>
                <Heading level={4} className="mb-4 text-sm uppercase">
                  {plan.description}
                </Heading>
                <Heading
                  level={4}
                  className="mb-4 text-sm uppercase text-accent"
                >
                  {plan.price !== 0 &&
                    plan.available &&
                    APP_NAME?.toLowerCase() === 'tdf' &&
                    `everything on the ${
                      isAuthenticated
                        ? filteredPlans[i]?.title
                        : filteredPlans[i - 1]?.title
                    } package +`}
                </Heading>
                <ul className="mb-4">
                  {parseSubscriptionPerks(plan.perks).map((perk) => (
                    <li
                      key={perk.title}
                      className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                    >
                      <div className="block">
                        {perk.title.includes('<') ? (
                          <span
                            className="block font-medium"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeSubscriptionPerkHtml(perk.title),
                            }}
                          />
                        ) : (
                          <span className="block font-medium">{perk.title}</span>
                        )}
                        {perk.description ? (
                          perk.description.includes('<') ? (
                            <span
                              className="block text-foreground/70 mt-1"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeSubscriptionPerkHtml(
                                  perk.description,
                                ),
                              }}
                            />
                          ) : (
                            <span className="block text-foreground/70 mt-1">
                              {perk.description}
                            </span>
                          )
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="text-accent">
                  {isFirstMonthFreePlan(plan) && (
                    <span className="block font-semibold mb-1">
                      {t('subscriptions_first_month_free')}
                    </span>
                  )}
                  {plan?.note && <span>{plan?.note}</span>}
                </div>
              </div>
            </div>
            <div className="w-[290px] text-center flex flex-wrap justify-center">
              {plan.available === false ? (
                <Heading level={3} className="uppercase">
                  <span className="block">🤩</span>
                  {t('generic_coming_soon')}
                </Heading>
              ) : (
                <>
                  <div className="w-full text-center text-2xl font-bold my-8">
                    <div>
                      {getCurrencySymbol(currency)}
                      {plan.price}
                    </div>
                    <p className="text-sm font-normal">
                      {normalizeSubscriptionBillingPeriod(plan?.billingPeriod) ===
                      'year'
                        ? t('subscriptions_summary_per_year')
                        : t('subscriptions_summary_per_month')}
                    </p>
                  </div>
                  <Button
                    isEnabled={true}
                    onClick={() =>
                      clickHandler(
                        plan.priceId,
                        !!plan.variants,
                        plan.slug as string,
                      )
                    }
                    isFullWidth={false}
                    infoText={getSubscriptionInfoText(plan)}
                    size="small"
                  >
                    {getCtaText(plan.price, slugify(plan.title))}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};

export default SubscriptionCards;
