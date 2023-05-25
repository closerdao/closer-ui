import dayjs from 'dayjs';

import { SubscriptionPlan } from '../../types/subscriptions';
import { __, getCurrencySymbol } from '../../utils/helpers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Heading from '../ui/Heading';

interface SubscriptionCardsProps {
  clickHandler: (priceId: string, hasVariants: boolean, slug: string) => void;
  filteredSubscriptionPlans: SubscriptionPlan[];
  userActivePlan?: SubscriptionPlan;
  validUntil?: Date;
  cancelledAt?: Date;
  currency: string;
}

const SubscriptionCards = ({
  clickHandler,
  filteredSubscriptionPlans,
  userActivePlan,
  validUntil,
  cancelledAt,
  currency,
}: SubscriptionCardsProps) => {
  const getSubscriptionInfoText = (plan: SubscriptionPlan) => {
    if (userActivePlan?.title === plan.title && validUntil && !cancelledAt) {
      return (
        <>
          {__('subscriptions_next_billing_date')}{' '}
          {dayjs(validUntil).format('LL')}
        </>
      );
    }
    if (userActivePlan?.title === plan.title && cancelledAt) {
      if (cancelledAt > new Date()) {
        return (
          <>
            {__('subscriptions_expires_at')} {dayjs(cancelledAt).format('LL')}
          </>
        );
      } else {
        return <>{__('subscriptions_cancelled')}</>;
      }
    }
    // if (plan.price !== 0) {
    //   return __('subscriptions_cancel_anytime');
    // } else {
    //   return null;
    // }
  };

  return (
    <>
      <div className="pt-16 flex gap-2 w-full flex-col">
        {filteredSubscriptionPlans &&
          filteredSubscriptionPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`w-full pb-8 ${
                !plan.available && plan.price && 'bg-accent-light'
              }`}
            >
              <div className="flex items-center gap-4 flex-col md:flex-row">
                <div
                  className={`bg-[url(/images/subscriptions/${plan.slug}.png)] w-[200px] h-[320px] md:h-[250px] bg-contain bg-no-repeat bg-[center_center] `}
                ></div>

                <div className="w-[90%] md:w-[60%]">
                  <Heading level={2} className="border-b-0 mb-6">
                    {plan.title}
                  </Heading>
                  <Heading level={4} className="mb-4 text-sm uppercase">
                    {plan.description}
                  </Heading>
                  <ul className="mb-4">
                    {plan.perks.map((perk) => {
                      return (
                        <li
                          key={perk}
                          className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                        >
                          <span className="block">{perk}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className=" w-[290px] text-center">
                  {plan.available === false ? (
                    <Heading level={3} className="uppercase">
                      <span className="block">🤩</span>
                      {__('generic_coming_soon')}
                    </Heading>
                  ) : (
                    <>
                      <div className="w-full text-center text-2xl font-bold my-8">
                        {plan.variants ? (
                          <div className="flex justify-center gap-4">
                            {plan.variants.map((variant) => {
                              return (
                                <div key={variant.title}>
                                  <div className='text-accent'>🥕 {variant.monthlyCredits}</div>
                                  <div>
                                    {getCurrencySymbol(currency)}
                                    {variant.price}
                                  </div>
                                  <p className="text-sm font-normal">
                                    {__('subscriptions_summary_per_month')}
                                  </p>
                                 
                                </div>
                              );
                            })}
                          </div>
                        ) : plan.price === 0 ? (
                          __('subscriptions_free')
                        ) : (
                          <div>
                            <div>
                              {getCurrencySymbol(currency)}
                              {plan.price}
                            </div>
                            <p className="text-sm font-normal">
                              {__('subscriptions_summary_per_month')}
                            </p>
                          </div>
                        )}
                      </div>{' '}
                      <Button
                        isEnabled={true}
                        onClick={() => clickHandler(plan.priceId, !!plan.variants, plan.slug)}
                        infoText={getSubscriptionInfoText(plan)}
                        className={` ${plan.price === 0 ? 'mb-7' : ''} || ''`}
                        size="small"
                      >
                        {plan.price === 0
                          ? __('subscriptions_create_account_button')
                          : userActivePlan?.title === plan.title
                          ? __('subscriptions_active_button')
                          : __('subscriptions_subscribe_button')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </>
  );
};

export default SubscriptionCards;
