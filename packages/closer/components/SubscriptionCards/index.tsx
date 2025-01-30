import Image from 'next/image';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { CloserCurrencies } from '../../types/currency';
import { SubscriptionPlan } from '../../types/subscriptions';
import { getCurrencySymbol } from '../../utils/helpers';
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
  const { isAuthenticated, user } = useAuth();

  const isMember = user?.roles?.includes('member');

  const paidSubscriptionPlans = plans.filter((plan) => plan.priceId !== 'free');
  const filteredPlans = isAuthenticated ? paidSubscriptionPlans : plans;

  const getCtaText = (price: number, slug: string) => {
    if (slug === 'citizen') {
      if (isMember) {
        return t('subscriptions_citizen_finance_tokens_button');
      } else {
        return t('subscriptions_citizen_become_citizen');
      }
    }

    if (price === 0) {
      return t('subscriptions_create_account_button');
    }
    if (userActivePlan?.price !== 0) {
      return t('subscriptions_manage_button');
    }
    return t('subscriptions_subscribe_button');
  };

  const getSubscriptionInfoText = (plan: SubscriptionPlan) => {
    if (userActivePlan?.title === plan.title && validUntil && !cancelledAt) {
      return (
        <>
          {t('subscriptions_next_billing_date')}{' '}
          {dayjs(validUntil).format('LL')}
        </>
      );
    }
    if (userActivePlan?.title === plan.title && cancelledAt) {
      if (cancelledAt > new Date()) {
        return (
          <>
            {t('subscriptions_expires_at')} {dayjs(cancelledAt).format('LL')}
          </>
        );
      } else {
        return <>{t('subscriptions_cancelled')}</>;
      }
    }
  };

  return (
    <>
      {filteredPlans &&
        filteredPlans.map((plan, i) => (
          <Card
            key={plan.title}
            className={`w-full pb-8 mb-6 ${
              !plan.available && 'bg-accent-light'
            }`}
          >
            <div className="flex items-center gap-4 flex-col md:flex-row text-sm">
              <Image
                alt={plan.slug || ''}
                src={`/images/subscriptions/${plan.slug}.png`}
                width={200}
                height={320}
              />
              <div className="w-[90%] md:w-[60%]">
                <Heading level={2} className="border-b-0 mb-6">
                  {plan.title}
                </Heading>
                {plan.slug !== 'citizen' || process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' ? (
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
                        `everything on the ${
                          isAuthenticated ? plans[i].title : plans[i - 1].title
                        } package +`}
                    </Heading>
                    <ul className="mb-4">
                      {plan.perks.split(',').map((perk) => {
                        return (
                          <li
                            key={perk}
                            className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                          >
                            <span className="block">
                              {perk.includes('<') ? (
                                <span
                                  dangerouslySetInnerHTML={{ __html: perk }}
                                />
                              ) : (
                                perk
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="text-accent">
                      {plan?.note && <span>{plan?.note}</span>}
                    </div>
                  </div>
                ) : (
                  <div>{t('generic_coming_soon')}</div>
                )}
              </div>
              {plan.slug !== 'citizen' || process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' ? (
                <div className="w-[290px] text-center flex flex-wrap justify-center">
                  {plan.available === false ? (
                    <Heading level={3} className="uppercase">
                      <span className="block">🤩</span>
                      {t('generic_coming_soon')}
                    </Heading>
                  ) : (
                    <>
                      <div className="w-full text-center text-2xl font-bold my-8">
                        {plan.priceId === 'free' ? (
                          t('subscriptions_free')
                        ) : (
                          <div>
                            {plan.slug === 'citizen' && (
                              <div>
                                <p className="text-sm font-normal">
                                  {t('subscriptions_hold')}
                                </p>
                                <p>
                                  {getCurrencySymbol(CloserCurrencies.TDF)}
                                  {30}
                                </p>
                                <p className="text-sm font-normal">
                                  {t('subscriptions_from')}
                                </p>
                              </div>
                            )}
                            <div>
                              {getCurrencySymbol(currency)}
                              {plan.price}
                            </div>
                            <p className="text-sm font-normal">
                              {plan.slug === 'citizen'
                                ? t('subscriptions_for_3_years')
                                : t('subscriptions_summary_per_month')}
                            </p>
                          </div>
                        )}
                      </div>{' '}
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
                        className={`${plan.price === 0 ? 'mb-7' : ''}`}
                        size="small"
                      >
                        {getCtaText(plan.price, plan.slug)}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        ))}
    </>
  );
};

export default SubscriptionCards;
