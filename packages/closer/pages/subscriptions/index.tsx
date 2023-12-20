import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import AccommodationOptions from '../../components/AccommodationOptions';
import PageError from '../../components/PageError';
import Resources from '../../components/Resources';
import Reviews from '../../components/Reviews';
import SubscriptionCards from '../../components/SubscriptionCards';
import { Button, Heading } from '../../components/ui/';

import { NextPage } from 'next';

import { DEFAULT_CURRENCY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { Listing } from '../../types';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

// Reviews are taken from Google maps:
const REVIEWS = [
  {
    name: 'Jeremy Agnew',
    rating: 5,
    text: 'A wondrous magical place where musicians turn up out the blue and made the hills come alive with traditional Alentejo music; where lovely people from around the world are building an inspirational new village on the edge of Abela; where the older generation welcomed them with open hearts and arms at the invigoration they are bringing to this cute little town with a deep cultural heritage. TDF is where we all want to live!',
    photo: '/images/reviews/r-1.png',
  },
  {
    name: 'Vinay Chaudhri',
    rating: 5,
    text: 'Don’t come here. The community is way too kind. The nature is way too peaceful. The ideas are way too beautiful. It’ll ruin your life. But maybe that’s exactly what you’re looking for...🤣 …',
    photo: '/images/reviews/r-2.png',
  },
  {
    name: 'Kyle Schutter',
    rating: 5,
    text: 'A place for bohemian makers, the intersection of Permaculture and crypto. My kind of place.',
    photo: '/images/reviews/r-3.png',
  },
  {
    name: 'Julian Guderley',
    rating: 5,
    text: 'Powerful innovation space. Re:Build Event with many aspects, diverse learnings and brilliant people.',
    photo: '/images/reviews/r-4.png',
  },
  {
    name: 'Vincent Spehner',
    rating: 5,
    text: 'Simply awesome. The future of humanity',
    photo: '/images/reviews/r-5.png',
  },
];

interface Props {
  subscriptionPlans: SubscriptionPlan[];
  listings: Listing[];
  error?: string;
}

const SubscriptionsPage: NextPage<Props> = ({
  subscriptionPlans,
  listings,
  error,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const router = useRouter();

  const { PLATFORM_NAME } = useConfig() || {};

  const plans: SubscriptionPlan[] = subscriptionPlans;

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
          <link
            rel="canonical"
            href="https://www.traditionaldreamfactory.com/subscriptions"
            key="canonical"
          />
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
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${__('subscriptions_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center">
          <div className="w-full">
            <Heading
              level={1}
              className="font-extrabold mb-6 uppercase text-center"
            >
              <div className="text-2xl sm:text-5xl">
                {__('pricing_and_product_heading_1')}
              </div>
              <div className="text-2xl sm:text-5xl">
                {__('pricing_and_product_heading_2')}
              </div>
              <div className="text-5xl sm:text-7xl leading-12">
                {__('pricing_and_product_heading_3')}
              </div>
            </Heading>
            <div className="flex justify-center flex-wrap ">
              <p className="mb-4 max-w-[630px]">
                {__('pricing_and_product_intro_1')}
              </p>
              <p className="mb-4 font-bold uppercase max-w-[630px]">
                {__('pricing_and_product_intro_2')}
              </p>
            </div>
          </div>
        </div>
        <SubscriptionCards
          plans={plans}
          clickHandler={handleNext}
          userActivePlan={userActivePlan}
          validUntil={user?.subscription?.validUntil}
          cancelledAt={user?.subscription?.cancelledAt}
          currency={DEFAULT_CURRENCY}
        />

        <section className="flex items-center flex-col py-24">
          <div className="w-full  ">
            <div className="text-center mb-20 flex flex-wrap justify-center">
              <Heading
                level={2}
                className="mb-4 uppercase pt-60 w-full font-bold text-6xl bg-[url(/images/illy-token.png)] bg-no-repeat bg-[center_top]"
              >
                {__('pricing_and_product_heading_funding_your_stay')}
              </Heading>
              <p className="mb-4 w-full">
                {__('pricing_and_product_subheading_accommodation')}
              </p>
              <div
                className="mb-10"
                dangerouslySetInnerHTML={{
                  __html: __('pricing_and_product_funding_your_stay_intro'),
                }}
              />
              <div className="mb-10 w-full flex flex-wrap justify-center">
                <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_cost_of_events')}
                </span>{' '}
                =
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_event_fee')}
                </span>{' '}
                +
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_utility_fee_2')}
                </span>{' '}
                +
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_accommodation_fee')}
                </span>
              </div>
              <div className="mb-10 w-full flex flex-wrap justify-center">
                <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_cost_of_stays')}
                </span>{' '}
                =
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_utility_fee_2')}
                </span>{' '}
                +
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_accommodation_fee')}
                </span>
              </div>
              <div className="mb-10 w-full flex flex-wrap justify-center">
                <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_cost_of_volunteering')}
                </span>{' '}
                =
                <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                  {__('pricing_and_product_utility_fee_2')}
                </span>
              </div>
              <div
                className="mb-10"
                dangerouslySetInnerHTML={{
                  __html: __('pricing_and_product_costs_info'),
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col justify-between w-[100%] sm:w-1/2 bg-[url(/images/subscriptions/funding-bg-1.jpg)] p-4 bg-cover">
                <div>
                  <Heading level={2} className="uppercase text-4xl mb-6">
                    {__('pricing_and_product_heading_carrots')}
                  </Heading>
                  <p className="text-sm mb-4">
                    {__('pricing_and_product_carrots_text_1')}
                  </p>
                  <p className="text-sm mb-10">
                    {__('pricing_and_product_carrots_text_2')}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    size="small"
                    isFullWidth={false}
                    onClick={() => {
                      router.push('/settings/credits');
                    }}
                  >
                    {__('pricing_and_product_learn_more_button')}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col justify-between w-[100%] sm:w-1/2 bg-[url(/images/subscriptions/funding-bg-2.jpg)] p-4 bg-cover">
                <div>
                  <Heading level={2} className="uppercase text-4xl mb-6">
                    {__('pricing_and_product_heading_tdf')}
                  </Heading>
                  <p className="text-sm mb-4">
                    {__('pricing_and_product_tdf_text_1')}
                  </p>
                  <p className="text-sm mb-10">
                    {__('pricing_and_product_tdf_text_2')}
                  </p>
                </div>
                <div className="flex justify-end">
                  {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true' && (
                    <Button
                      size="small"
                      isFullWidth={false}
                      onClick={() => {
                        router.push('/settings/token');
                      }}
                    >
                      {__('pricing_and_product_learn_more_button')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

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

        <section className="bg-neutral py-16 my-16">
          <div className="text-center mb-6 flex flex-wrap justify-center">
            <Heading
              level={2}
              className="mb-4 uppercase w-full font-bold text-4xl sm:text-6xl"
            >
              {__('pricing_and_product_heading_say_cheese')}
            </Heading>
            <p className="mb-4 w-full">
              {__('pricing_and_product_subheading_say_cheese')}
            </p>
          </div>
          <div className="flex justify-center sm:justify-between  flex-wrap ">
            <Image
              src="/images/gallery/gallery-1.jpg"
              alt={PLATFORM_NAME}
              width={556}
              height={354}
              className="mb-4 w-[80%] sm:w-[32%]"
            />
            <Image
              src="/images/gallery/gallery-2.jpg"
              alt={PLATFORM_NAME}
              width={225}
              height={354}
              className="mb-4 w-[80%] sm:w-[16%]"
            />
            <Image
              src="/images/gallery/gallery-3.jpg"
              alt={PLATFORM_NAME}
              width={556}
              height={354}
              className="mb-4 w-[80%] sm:w-[32%]"
            />
            <Image
              src="/images/gallery/gallery-4.jpg"
              alt={PLATFORM_NAME}
              width={225}
              height={354}
              className="mb-4 w-[80%] sm:w-[16%]"
            />

            <Image
              src="/images/gallery/gallery-5.jpg"
              alt={PLATFORM_NAME}
              width={225}
              height={354}
              className="mb-4 w-[80%] sm:w-[16%]"
            />
            <Image
              src="/images/gallery/gallery-6.jpg"
              alt={PLATFORM_NAME}
              width={556}
              height={354}
              className="mb-4 w-[80%] sm:w-[32%]"
            />
            <Image
              src="/images/gallery/gallery-7.jpg"
              alt={PLATFORM_NAME}
              width={225}
              height={354}
              className="mb-4 w-[80%] sm:w-[16%]"
            />
            <Image
              src="/images/gallery/gallery-8.jpg"
              alt={PLATFORM_NAME}
              width={556}
              height={354}
              className="mb-4 w-[80%] sm:w-[32%]"
            />
          </div>
        </section>

        <Reviews reviews={REVIEWS} />
        <Resources />
      </main>
    </div>
  );
};

SubscriptionsPage.getInitialProps = async () => {
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
      listings: listings,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      listings: [],
      error: parseMessageFromError(err),
    };
  }
};

export default SubscriptionsPage;
