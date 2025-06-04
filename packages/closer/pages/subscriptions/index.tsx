import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import AccommodationOptions from '../../components/AccommodationOptions';
import PageError from '../../components/PageError';
import Resources from '../../components/Resources';
import Reviews from '../../components/Reviews';
import SubscriptionCards from '../../components/SubscriptionCards';
import { Button, Heading } from '../../components/ui/';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY, MAX_LISTINGS_TO_FETCH } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig, Listing } from '../../types';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };
  generalConfig: GeneralConfig | null;
  listings: Listing[];
  error?: string;
}

const SubscriptionsPage: NextPage<Props> = ({
  subscriptionsConfig,
  generalConfig,
  listings,
  error,
}) => {
  const t = useTranslations();
  const { isAuthenticated, isLoading, user } = useAuth();
  const defaultConfig = useConfig();
  const { APP_NAME } = defaultConfig;
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  
  const router = useRouter();

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const plans: any[] = prepareSubscriptions(subscriptionsConfig);

  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();


  const hasComponentRendered = useRef(false);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      (async () => {
        try {
          await api.post('/metric', {
            event: 'page-view',
            value: 'subscriptions',
            point: 0,
            category: 'engagement',
          });
        } catch (error) {
          console.error('Error logging page view:', error);
        }
      })();
      hasComponentRendered.current = true;
    }
  }, []);

  useEffect(() => {

    const isSubscriber = user?.subscription?.plan && new Date(user?.subscription?.validUntil || '') > new Date();
    const selectedSubscription = plans?.find(
      (plan: any) => plan.priceId === (user?.subscription?.priceId || 'free'),
    );
    setUserActivePlan(isSubscriber ? selectedSubscription : undefined);
  }, [user]);

  const handleNext = async (
    priceId: string,
    hasVariants: boolean,
    slug: string,
  ) => {
    if (slug === 'citizen') {
      router.push('/subscriptions/citizen/validation');
      return;
    }
    if (priceId?.includes(',')) {
      priceId = (priceId as string).split(',')[0];
    }
    if (!isAuthenticated) {
      // User has no account - must start with creating one.
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else if (!userActivePlan) {
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    } else if (userActivePlan?.priceId !== 'free') {
      // User has a subscription - must be managed in Stripe.

      const response = await api.get(
        '/stripe/create-customer-portal?email=' +
          encodeURIComponent(user?.email || ''),
      );

      const portalUrl = response.data.sessionUrl;
      router.push(portalUrl);

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

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${t('subscriptions_title')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center">
          <div className="w-full">
            <Heading
              level={1}
              className="font-extrabold mb-6 uppercase text-center"
            >
              {APP_NAME.toLowerCase() === 'tdf' ? (
                <>
                  <div className="text-2xl sm:text-5xl">
                    {t('pricing_and_product_heading_1')}
                  </div>
                  <div className="text-2xl sm:text-5xl">
                    {t('pricing_and_product_heading_2')}
                  </div>
                  <div className="text-5xl sm:text-7xl leading-12">
                    {t('pricing_and_product_heading_3')}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl sm:text-5xl">
                    {t('subscriptions_title')}
                  </div>
                </>
              )}
            </Heading>

            {APP_NAME.toLowerCase() === 'tdf' ? (
              <div className="flex justify-center flex-wrap ">
                <p className="mb-4 max-w-[630px]">
                  {t('pricing_and_product_intro_1')}
                </p>
                <p className="mb-4 font-bold uppercase max-w-[630px]">
                  {t('pricing_and_product_intro_2')}
                </p>
              </div>
            ) : (
              <div className="flex justify-center flex-wrap ">
                <p className="mb-4 max-w-[630px]">{t('subscriptions_intro')}</p>
              </div>
            )}
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

        {APP_NAME.toLowerCase() === 'tdf' && (
          <>
            <section className="flex items-center flex-col py-24">
              <div className="w-full  ">
                <div className="text-center mb-20 flex flex-wrap justify-center">
                  <Heading
                    level={2}
                    className="mb-4 uppercase pt-60 w-full font-bold text-6xl bg-[url(/images/illy-token.png)] bg-no-repeat bg-[center_top]"
                  >
                    {t('pricing_and_product_heading_funding_your_stay')}
                  </Heading>
                  <p className="mb-4 w-full">
                    {t('pricing_and_product_subheading_accommodation')}
                  </p>
                  <div
                    className="mb-10"
                    dangerouslySetInnerHTML={{
                      __html: t.raw(
                        'pricing_and_product_funding_your_stay_intro',
                      ),
                    }}
                  />
                  <div className="mb-10 w-full flex flex-wrap justify-center">
                    <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_cost_of_events')}
                    </span>{' '}
                    =
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_event_fee')}
                    </span>{' '}
                    +
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_utility_fee_2')}
                    </span>{' '}
                    +
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_accommodation_fee')}
                    </span>
                  </div>
                  <div className="mb-10 w-full flex flex-wrap justify-center">
                    <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_cost_of_stays')}
                    </span>{' '}
                    =
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_utility_fee_2')}
                    </span>{' '}
                    +
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_accommodation_fee')}
                    </span>
                  </div>
                  <div className="mb-10 w-full flex flex-wrap justify-center">
                    <span className="mb-4 bg-black text-white rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_cost_of_volunteering')}
                    </span>{' '}
                    =
                    <span className="mb-4 bg-accent-light text-accent rounded-full py-1 px-4 uppercase mx-2">
                      {t('pricing_and_product_utility_fee_2')}
                    </span>
                  </div>
                  <div
                    className="mb-10"
                    dangerouslySetInnerHTML={{
                      __html: t.raw('pricing_and_product_costs_info'),
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col justify-between w-[100%] sm:w-1/2 bg-[url(/images/subscriptions/funding-bg-1.jpg)] p-4 bg-cover">
                    <div>
                      <Heading level={2} className="uppercase text-4xl mb-6">
                        {t('pricing_and_product_heading_carrots')}
                      </Heading>
                      <p className="text-sm mb-4">
                        {t('pricing_and_product_carrots_text_1')}
                      </p>
                      <p className="text-sm mb-10">
                        {t('pricing_and_product_carrots_text_2')}
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
                        {t('pricing_and_product_learn_more_button')}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between w-[100%] sm:w-1/2 bg-[url(/images/subscriptions/funding-bg-2.jpg)] p-4 bg-cover">
                    <div>
                      <Heading level={2} className="uppercase text-4xl mb-6">
                        {t('pricing_and_product_heading_tdf')}
                      </Heading>
                      <p className="text-sm mb-4">
                        {t('pricing_and_product_tdf_text_1')}
                      </p>
                      <p className="text-sm mb-10">
                        {t('pricing_and_product_tdf_text_2')}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      {process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE ===
                        'true' && (
                        <Button
                          size="small"
                          isFullWidth={false}
                          onClick={() => {
                            router.push('/settings/token');
                          }}
                        >
                          {t('pricing_and_product_learn_more_button')}
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
                    {t('pricing_and_product_heading_accommodation')}
                  </Heading>
                  <p className="mb-4 w-full">
                    {t('pricing_and_product_subheading_accommodation')}
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
                  {t('pricing_and_product_heading_say_cheese')}
                </Heading>
                <p className="mb-4 w-full">
                  {t('pricing_and_product_subheading_say_cheese')}
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
            <Reviews />
            <Resources />
          </>
        )}
      </main>
    </div>
  );
};

SubscriptionsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, generalRes, listingRes, messages] =
      await Promise.all([
        api.get('/config/subscriptions').catch(() => {
          return null;
        }),
        api.get('/config/general').catch(() => {
          return null;
        }),
        api
          .get('/listing', {
            params: {
              limit: MAX_LISTINGS_TO_FETCH,
            },
          })
          .catch(() => {
            return null;
          }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;
    const generalConfig = generalRes?.data?.results?.value;
    const listings = listingRes?.data.results;

    return {
      subscriptionsConfig,
      generalConfig,
      listings,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },
      generalConfig: null,
      listings: [],
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default SubscriptionsPage;
