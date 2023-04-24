import { __ } from 'closer/utils/helpers';

import { SubscriptionPlan, Subscriptions } from '../../types/subscriptions';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Heading from '../ui/Heading';

interface SubscriptionCardsProps {
  clickHandler: (priceId: string) => void;
  filteredSubscriptionPlans: SubscriptionPlan[];
  config: Subscriptions['config'];
  userActivePlan?: SubscriptionPlan;
}

const SubscriptionCards = ({
  clickHandler,
  filteredSubscriptionPlans,
  config,
  userActivePlan,
}: SubscriptionCardsProps) => {
  return (
    <>
      <div className="pt-16 flex gap-8 w-full flex-col md:flex-row">
        {filteredSubscriptionPlans &&
          filteredSubscriptionPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`w-full md:w-[${Math.floor(
                100 / filteredSubscriptionPlans.length,
              )}%]`}
            >
              <div>
                <Heading level={3} className="text-center border-b-0 mb-6">
                  <p>{plan.emoji}</p>
                  {plan.title}
                </Heading>
                <p className="mb-4">{plan.description}</p>
                <ul className="mb-4">
                  {plan.perks.map((perk) => {
                    return (
                      <li key={perk} className="">
                        {perk}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <div className="w-full text-center text-2xl font-bold my-8">
                  {plan.price === 0 ? (
                    __('subscriptions_free')
                  ) : (
                    <div>
                      <div>
                        {config.symbol}
                        {plan.price}
                      </div>
                      <p className="text-sm font-normal">
                        {__('subscriptions_summary_per_month')}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  isEnabled={plan.available !== false}
                  onClick={() => clickHandler(plan.priceId)}
                  infoText={`${
                    plan.price !== 0 ? __('subscriptions_cancel_anytime') : ''
                  }`}
                  className={` ${plan.price === 0 ? 'mb-7' : ''} || ''`}
                >
                  {
                    plan.available === false
                    ? __('generic_coming_soon')
                    : plan.price === 0
                    ? __('subscriptions_create_account_button')
                    : userActivePlan?.title === plan.title
                    ? __('subscriptions_active_button')
                    : __('subscriptions_subscribe_button')}

                </Button>
              </div>
            </Card>
          ))}
      </div>
    </>
  );
};

export default SubscriptionCards;
