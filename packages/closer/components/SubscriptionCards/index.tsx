import { useConfig } from '../../hooks/useConfig';
import { Subscription } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Heading from '../ui/Heading';

interface SubscriptionCardsProps {
  clickHandler: (priceId: string) => void;
}

const SubscriptionCards = ({ clickHandler }: SubscriptionCardsProps) => {
  const { SUBSCRIPTION_PLANS } = useConfig() || {};

  const subscriptions: Subscription[] = SUBSCRIPTION_PLANS;
  return (
    <>
      <div className="mt-16 flex gap-8 w-full flex-col md:flex-row">
        {subscriptions &&
          subscriptions.map((subscription) => (
            <Card
              key={subscription.title}
              className={`w-full md:w-[${Math.floor(
                100 / subscriptions.length,
              )}%]`}
            >
              <div>
                <Heading level={2} className="text-center border-b-0"><p>{subscription.emoji}</p>{subscription.title}</Heading>
                <p className="mb-4">{subscription.description}</p>
                <ul className="mb-4">
                  {subscription.perks.map((perk) => {
                    return (
                      <li key={perk} className="">
                        {perk}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="w-full text-center text-2xl font-bold my-8">
                  {subscription.price === 0 ? (
                    'Free'
                  ) : (
                    <div>
                      <div>€{subscription.price}</div>{' '}
                      <p className="text-sm font-normal">per month</p>
                    </div>
                  )}
                </p>
                <Button clickHandler={() => clickHandler(subscription.priceId)}>
                  Subscribe
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </>
  );
};

export default SubscriptionCards;
