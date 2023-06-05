import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import PageError from '../../components/PageError';
import SubscriptionCards from '../../components/SubscriptionCards';
import { Button, Card, Heading } from '../../components/ui/';

import { NextPage } from 'next';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

import Image from 'next/image';

const TESTIMONIALS = [
  {
    name: 'Vinay',
    rating: 3,
    text: '“Don’t come here. The community is way too kind. The nature is way too peaceful. The ideas are way too beautiful. It’ll ruin your life. But maybe that’s exactly what you’re looking for...”',
    photo: '/images/testimonials/testimonial-author-1.jpg',
  },
  { name: 'Vova', rating: 5, text: 'I like TDF!', photo: '/images/testimonials/testimonial-author-1.jpg' },
];

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  error?: string;
}

const SubscriptionsPage: NextPage<Props> = ({ subscriptionPlans, error }) => {

  console.log('subscriptionPlans=', subscriptionPlans);
  const { isAuthenticated, isLoading, user } = useAuth();

  const router = useRouter();
  const { PLATFORM_NAME } = useConfig() || {};

  const plans: SubscriptionPlan[] = subscriptionPlans;
  const paidSubscriptionPlans = plans.filter((plan) => plan.price !== 0);

  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();

  useEffect(() => {
    const selectedSubscription = subscriptionPlans.find(
      (plan: SubscriptionPlan) =>
        plan.priceId === (user?.subscription?.priceId || 'free'),
    );
    setUserActivePlan(selectedSubscription);
  }, [user]);

  const handleNext = (priceId: string, hasVariants: boolean, slug: string) => {
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
      if (hasVariants) {
        // User does not yet have a subscription and subscription has avriants - redirect to variant selection page
        router.push(`/subscriptions/${slug}`);
      } else {
        // User does not yet have a subscription, we can show the checkout
        router.push(`/subscriptions/summary?priceId=${priceId}`);
      }
    }
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (isLoading) {
    return null;
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS !== 'true') {
    return (
      <>
        <Head>
          <title>{`${__(
            'settings_your_subscription_title',
          )} - ${PLATFORM_NAME}`}</title>
        </Head>

        <div className="max-w-6xl mx-auto">
          <Heading level={1} className="mb-14">
            ♻️ {__('pricing_and_product_heading_1')}
          </Heading>

          <Heading level={2}>Coming soon!</Heading>
        </div>
      </>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <Head>
        <title>{`${__('subscriptions_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center">
          <div className="">
            <Heading level={1} className="mb-6 uppercase text-center">
              <div className="font-extrabold text-4xl">
                {__('pricing_and_product_heading_1')}
              </div>
              <div className="font-extrabold text-3xl">
                {__('pricing_and_product_heading_2')}
              </div>
              <div className="font-extrabold text-[3.5rem] leading-12">
                {__('pricing_and_product_heading_3')}
              </div>
            </Heading>
            <div>
              <p className="mb-4 max-w-[470px]">
                {__('pricing_and_product_intro_1')}
              </p>
              <p className="mb-4 max-w-[470px]">
                {__('pricing_and_product_intro_2')}
              </p>
            </div>
          </div>
        </div>
        <SubscriptionCards
          filteredSubscriptionPlans={
            isAuthenticated ? paidSubscriptionPlans : plans
          }
          clickHandler={handleNext}
          userActivePlan={userActivePlan}
          validUntil={user?.subscription?.validUntil}
          cancelledAt={user?.subscription?.cancelledAt}
          currency={DEFAULT_CURRENCY}
        />

        {/* testimonials wip */}
        {/* <Card className="mb-6">
          {TESTIMONIALS.map((testimonial) => {
            return (
              <>
                <div className="border flex ">
                  <Image src={testimonial.photo} alt='tesimonial 1' width={100} height={100} />
                  <div>
                    <div className='w-full'>
                      <Heading level={3}>{testimonial.name}</Heading>
                      <ul className="flex justify-center">
                        {[...Array(5).keys()].map((i) => {
                          const rating = i + 1;
                          return (
                            <li key={i}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className={`mr-1 h-5 w-5 ${
                                  testimonial.rating >= rating
                                    ? 'text-accent'
                                    : 'text-disabled'
                                } `}
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                <p>{testimonial.text}</p>
                </div>
              </>
            );
          })}
        </Card> */}

        <Card>
          <div className="flex flex-col sm:flex-row divide-x flex-wrap">
            <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
              <Heading level={3} className="uppercase text-center">
                {__('heading_pink_paper')}
              </Heading>
              <p>{__('intro_pink_paper')}</p>
              <Button
                className="text-[16px]"
                onClick={() => {
                  router.push(
                    'https://docs.google.com/document/d/177JkHCy0AhplsaEEYpFHBsiI6d4uLk0TgURSKfBIewE/edit',
                  );
                }}
              >
                {__('read_button')}
              </Button>
            </div>
            <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
              <Heading level={3} className="uppercase text-center">
                {__('heading_white_paper')}
              </Heading>
              <p>{__('intro_white_paper')}</p>
              <Button
                className="text-[16px]"
                onClick={() => {
                  router.push(
                    'https://oasa.earth/papers/OASA-Whitepaper-V1.2.pdf',
                  );
                }}
              >
                {__('read_button')}
              </Button>
            </div>
            <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
              <Heading level={3} className="uppercase text-center">
                {__('heading_oasa_website')}
              </Heading>
              <p>{__('intro_oasa_website')}</p>
              <Button
                className="text-[16px]"
                onClick={() => {
                  router.push('https://oasa.earth');
                }}
              >
                {__('visit_site_button')}
              </Button>
            </div>
            <div className="mb-8 px-6 py-8 text-center flex flex-col gap-8 w-full sm:w-1/2 lg:w-1/4">
              <Heading level={3} className="uppercase text-center">
                {__('heading_terms')}
              </Heading>
              <p>{__('intro_terms')}</p>
              <Button
                className="text-[16px]"
                onClick={() => {
                  router.push('/legal/terms');
                }}
              >
                {__('read_button')}
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

SubscriptionsPage.getInitialProps = async () => {
  try {
    const {
      data: { results },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionPlans: results.value.plans,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      error: parseMessageFromError(err),
    };
  }
};

export default SubscriptionsPage;
