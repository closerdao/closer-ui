import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AccommodationOptions from '../../components/AccommodationOptions';
import PageError from '../../components/PageError';
import SubscriptionCards from '../../components/SubscriptionCards';
import { Button, Card, Heading } from '../../components/ui';

import { NextPage } from 'next';
import { ParsedUrlQuery } from 'querystring';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { Listing } from '../../types';
import {
  SubscriptionPlan,
  SubscriptionVariant,
} from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import {
  __,
  getCurrencySymbol,
  getSubscriptionVariantPrice,
} from '../../utils/helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  slug?: string | string[] | undefined;
  error?: string;
  listings: Listing[];
}

const SubscriptionPlanPage: NextPage<Props> = ({
  subscriptionPlans,
  listings,
  slug,
  error,
}) => {
  const router = useRouter();

  const subscriptionPlan = subscriptionPlans.find((plan: SubscriptionPlan) => {
    return plan.slug === slug;
  });

  const { isAuthenticated, isLoading, user } = useAuth();

  const { PLATFORM_NAME } = useConfig() || {};

  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();

  useEffect(() => {
    const selectedSubscription = subscriptionPlans.find(
      (plan: SubscriptionPlan) =>
        plan.priceId === (user?.subscription?.priceId || 'free'),
    );
    setUserActivePlan(selectedSubscription);
  }, [user]);

  const handleNext = (priceId: string, monthlyCredits: number) => {
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else {
      // User does not yet have a subscription, we can show the checkout
      router.push(
        `/subscriptions/summary?priceId=${priceId}&monthlyCredits=${monthlyCredits}`,
      );
    }
  };

  const handleSelectPlan = (priceId: string, slug: string) => {
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else if (userActivePlan?.priceId !== 'free') {
      // User has a subscription - must be managed in Stripe.
      router.push(
        `${
          process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL
        }?prefilled_email=${encodeURIComponent(
          (user?.subscription?.stripeCustomerEmail as string) ||
            (user?.email as string),
        )}`,
      );
    } else {
      router.push(`/subscriptions/${slug}`);
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <Head>
        <title>{`${
          subscriptionPlan?.title === 'Wanderer'
            ? __('subscriptions_wanderer_title')
            : null
        }
              ${
                subscriptionPlan?.title === 'Pioneer'
                  ? __('subscriptions_pioneer_title')
                  : null
              } - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/2 text-sm mb-6">
            <Heading
              level={1}
              className="mb-6 uppercase text-4xl w-[300px] font-extrabold"
            >
              {subscriptionPlan?.title === 'Wanderer'
                ? __('subscriptions_wanderer_title')
                : null}

              {subscriptionPlan?.title === 'Pioneer'
                ? __('subscriptions_pioneer_title')
                : null}
            </Heading>

            {subscriptionPlan?.title === 'Pioneer'
              ? __('subscriptions_pioneer_intro_text')
              : null}
          </div>
          {subscriptionPlan?.title === 'Wanderer' ? (
            <div
              className={
                'min-h-[260px] w-full sm:w-1/2 bg-contain bg-[url(/images/subscriptions/wanderer-lg.png)] bg-[center_bottom] sm:bg-[right_bottom] bg-no-repeat '
              }
            ></div>
          ) : null}
          {subscriptionPlan?.title === 'Pioneer' ? (
            <div
              className={
                'min-h-[200px] w-full sm:w-1/2 bg-contain bg-[url(/images/subscriptions/pioneer-lg.png)] bg-[center_bottom] sm:bg-[right_bottom] bg-no-repeat '
              }
            ></div>
          ) : null}
        </div>

        {subscriptionPlan?.title === 'Wanderer' ? (
          <Card className="mb-4">
            <div className="flex flex-col gap-4 sm:gap-1 sm:flex-row items-center justify-between">
              <div className="w-full sm:w-2/5 flex flex-col gap-2">
                <Heading
                  level={3}
                  className="uppercase  text-center sm:text-left"
                >
                  {__('subscriptions_wanderer_package')}
                </Heading>
                <Heading level={4} className="mb-4 text-sm uppercase">
                  {subscriptionPlan.description}
                </Heading>
              </div>

              <div className="text-center">
                <div className=" font-bold text-xl">
                  {getCurrencySymbol(DEFAULT_CURRENCY)}
                  {subscriptionPlan.price}
                </div>
                <p className="text-sm font-normal">
                  {__('subscriptions_summary_per_month')}
                </p>
              </div>
              <Button
                isEnabled={true}
                onClick={() => handleNext(subscriptionPlan.priceId, 0)}
                size="medium"
                isFullWidth={false}
                className=" border"
              >
                {__('subscriptions_subscribe_button')}
              </Button>
            </div>
          </Card>
        ) : null}

        {subscriptionPlan?.variants &&
          subscriptionPlan.variants.map((variant: SubscriptionVariant) => {
            return (
              <div key={variant.title}>
                <Card className="mb-4">
                  <div className="flex flex-col gap-4 sm:gap-1 sm:flex-row items-center justify-between">
                    <Heading
                      level={3}
                      className="uppercase w-full sm:w-2/5 text-center sm:text-left"
                    >
                      {variant.title}
                    </Heading>
                    <div className="text-center">
                      <p className="text-accent text-2xl font-bold">
                        {variant.monthlyCredits} 🥕
                      </p>
                    </div>
                    <div className="text-center">
                      <div className=" font-bold text-xl">
                        {getCurrencySymbol(DEFAULT_CURRENCY)}
                        {getSubscriptionVariantPrice(
                          variant.monthlyCredits,
                          subscriptionPlan,
                        )}
                      </div>
                      <p className="text-sm font-normal">
                        {__('subscriptions_summary_per_month')}
                      </p>
                    </div>
                    <Button
                      isEnabled={true}
                      onClick={() =>
                        handleNext(
                          subscriptionPlan.priceId,
                          variant.monthlyCredits,
                        )
                      }
                      size="medium"
                      isFullWidth={false}
                      className=" border"
                    >
                      {__('subscriptions_subscribe_button')}
                    </Button>
                  </div>
                </Card>
              </div>
            );
          })}

        {subscriptionPlan?.title === 'Wanderer' ? (
          <section className="flex flex-col sm:flex-row my-24 gap-16">
            <div className="w-full sm:w-1/2 flex flex-col gap-4 text-sm ">
              <Heading level={2} className="text-5xl mb-4">
                {__('subscriptions_wanderer_subheading')}
              </Heading>

              <ul>
                {subscriptionPlan.perks.map((perk) => {
                  return (
                    <li
                      key={perk}
                      className="bg-[length:16px_16px] bg-[top_2px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                    >
                      <span className="block">
                        {perk.includes('<') ? (
                          <span dangerouslySetInnerHTML={{ __html: perk }} />
                        ) : (
                          perk
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="text-accent">
                {subscriptionPlan.note && <span>{subscriptionPlan.note}</span>}
              </div>
            </div>
            <div className="w-full sm:w-1/2">
              <Image
                src="/images/subscriptions/get-a-taste-for-life.jpg"
                alt=""
                width={530}
                height={549}
              />
            </div>
          </section>
        ) : null}

        {subscriptionPlan?.title === 'Pioneer' ? (
          <section className="flex flex-col sm:flex-row my-24 gap-16">
            <div className="w-full sm:w-1/2 flex flex-col gap-6 text-sm">
              <Heading level={2} className="text-5xl mb-4">
                {__('subscriptions_pioneer_subheading')}
              </Heading>
              <ul>
                {subscriptionPlan.perks.map((perk) => {
                  return (
                    <li
                      key={perk}
                      className="bg-[length:16px_16px] bg-[top_2px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                    >
                      <span className="block">
                        {perk.includes('<') ? (
                          <span dangerouslySetInnerHTML={{ __html: perk }} />
                        ) : (
                          perk
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="text-accent">
                {subscriptionPlan.note && <span>{subscriptionPlan.note}</span>}
              </div>
            </div>
            <div className="w-full sm:w-1/2">
              <Image
                src="/images/subscriptions/nurture-your-soul.jpg"
                alt=""
                width={530}
                height={549}
              />
            </div>
          </section>
        ) : null}

        <section className="flex items-center flex-col py-24">
          <div className="w-full  ">
            <div className="text-center mb-20 flex flex-wrap justify-center">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-bold text-4xl sm:text-6xl"
              >
                {__('pricing_and_product_heading_accommodation')}
              </Heading>
              <p className="mb-4 w-full">
                {__('pricing_and_product_subheading_accommodation')}
              </p>
            </div>
            <AccommodationOptions listings={listings} />
          </div>
        </section>

        <SubscriptionCards
          plans={subscriptionPlans}
          clickHandler={handleSelectPlan}
          userActivePlan={userActivePlan}
          validUntil={user?.subscription?.validUntil}
          cancelledAt={user?.subscription?.cancelledAt}
          currency={DEFAULT_CURRENCY}
          variant="noImage"
          slug={slug as string}
        />
      </main>
    </div>
  );
};

SubscriptionPlanPage.getInitialProps = async ({
  query,
}: {
  query: ParsedUrlQuery;
}) => {
  try {
    const [
      {
        data: { results: subscriptions },
      },
      {
        data: { results: listings },
      },
    ] = await Promise.all([
      api.get('/config/subscriptions'),
      api.get('/listing'),
    ]);

    return {
      subscriptionPlans: subscriptions.value.plans,
      listings,
      slug: query.slug,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      listings: [],
      error: parseMessageFromError(err),
    };
  }
};

export default SubscriptionPlanPage;
