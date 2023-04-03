import { SubscriptionPlan, Subscriptions } from '../../types';
import { __ } from '../../utils/helpers';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Heading from '../ui/Heading';

interface SubscriptionCardsProps {
  clickHandler: (priceId: string) => void;
  filteredSubscriptionPlans: SubscriptionPlan[];
  config: Subscriptions['config'];
}

const SubscriptionCards = ({
  clickHandler,
  filteredSubscriptionPlans,
  config,
}: SubscriptionCardsProps) => {
  return (
    <>
      <div className="mt-16 flex gap-8 w-full flex-col md:flex-row">
        {filteredSubscriptionPlans &&
          filteredSubscriptionPlans.map((plan) => (
            <Card
              key={plan.title}
              className={`w-full md:w-[${Math.floor(
                100 / filteredSubscriptionPlans.length,
              )}%]`}
            >
              <div>
                <Heading level={2} className="text-center border-b-0">
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
                  clickHandler={() => clickHandler(plan.priceId)}
                  infoText={`${
                    plan.price !== 0 ? __('subscriptions_cancel_anytime') : ''
                  }`}
                  className={`${plan.price === 0 && 'mb-[27px]'}`}
                >
                  {plan.price === 0
                    ? __('subscriptions_create_account_button')
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
