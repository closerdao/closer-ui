import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import PageError from '../../components/PageError';
import SubscriptionCards from '../../components/SubscriptionCards';
import { Heading } from '../../components/ui/';

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
              className="font-extrabold mb-6 uppercase text-center text-3xl"
            >
              {t('subscriptions_title')}
            </Heading>

            <div className="flex justify-center flex-wrap ">
              <p className="mb-4">{t('subscriptions_intro')}</p>
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