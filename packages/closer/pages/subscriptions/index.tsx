import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';

import Webinar from '../../components/Webinar';
import { Heading } from '../../components/ui/';

import { NextPage } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { SubscriptionPlan } from '../../types/subscriptions';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { parseSubscriptionPerks } from '../../utils/subscriptionPerks';
import { sanitizeSubscriptionPerkHtml } from '../../utils/sanitizeSubscriptionPerkHtml';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';
import { logMetric } from '../../utils/metrics';
import PageNotFound from '../not-found';

const SubscriptionsPage: NextPage = () => {
  const subscriptionsConfig = getCachedConfig('subscriptions') as {
    enabled: boolean;
    elements: SubscriptionPlan[];
  };
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const t = useTranslations();
  const { isAuthenticated, isLoading, user } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;

  const router = useRouter();

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const plans: any[] = prepareSubscriptions(subscriptionsConfig);
  const featuredPlan =
    plans.find((plan) => plan?.available && plan?.slug !== 'citizen') || plans[0];
  const featuredPlanPerks = parseSubscriptionPerks(featuredPlan?.perks);
  const formattedPrice = formatIsoFiatAmount(Number(featuredPlan?.price || 0), 'EUR');

  const [userActivePlan, setUserActivePlan] = useState<SubscriptionPlan>();

  const hasComponentRendered = useRef(false);

  useEffect(() => {
    if (!hasComponentRendered.current) {
      void logMetric({
        event: 'page-view',
        category: 'subscriptions',
        value: 'view',
      });
      hasComponentRendered.current = true;
    }
  }, []);

  useEffect(() => {
    const isSubscriber =
      user?.subscription?.plan &&
      new Date(user?.subscription?.validUntil || '') > new Date();
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
      void logMetric({
        event: 'become-citizen-button-click',
        category: 'citizenship',
        value: 'become',
      });
      router.push('/subscriptions/citizen/why');
      return;
    }
    if (priceId?.includes(',')) {
      priceId = (priceId as string).split(',')[0];
    }
    if (!isAuthenticated) {
      void logMetric({
        event: 'create-account-button-click',
        category: 'signup',
        value: 'subscription-checkout',
      });
      router.push(
        `/signup?back=${encodeURIComponent(
          `/subscriptions/summary?priceId=${priceId}`,
        )}`,
      );
    } else if (!userActivePlan) {
      void logMetric({
        event: 'subscribe-button-click',
        category: 'subscriptions',
        value: 'subscribe',
      });
      router.push(`/subscriptions/summary?priceId=${priceId}`);
    } else if (userActivePlan?.priceId !== 'free') {
      void logMetric({
        event: 'manage-subscription-button-click',
        category: 'subscriptions',
        value: 'manage',
      });

      const response = await api.get(
        '/stripe/create-customer-portal?email=' +
          encodeURIComponent(user?.email || ''),
      );

      const portalUrl = response.data.sessionUrl;
      router.push(portalUrl);
    } else {
      if (hasVariants) {
        void logMetric({
          event: 'subscribe-button-click',
          category: 'subscriptions',
          value: 'subscribe',
        });
        router.push(`/subscriptions/${slug}`);
      } else {
        void logMetric({
          event: 'subscribe-button-click',
          category: 'subscriptions',
          value: 'subscribe',
        });
        router.push(`/subscriptions/summary?priceId=${priceId}`);
      }
    }
  };

  if (isLoading) {
    return null;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  if (!featuredPlan) {
    return <PageNotFound error="" />;
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <Head>
        <title>{`${t('subscriptions_title')} - ${PLATFORM_NAME}`}</title>
        <meta
          name="description"
          content={`Join ${PLATFORM_NAME} with a subscription plan. Support our community and get access to exclusive benefits and features.`}
        />
        <meta name="keywords" content={`${PLATFORM_NAME}, subscriptions, membership, community membership, regenerative communities`} />
        <meta property="og:title" content={`${t('subscriptions_title')} - ${PLATFORM_NAME}`} />
        <meta property="og:description" content={`Join ${PLATFORM_NAME} with a subscription plan. Support our community and get access to exclusive benefits.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/subscriptions`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${t('subscriptions_title')} - ${PLATFORM_NAME}`} />
        <meta name="twitter:description" content={`Join ${PLATFORM_NAME} with a subscription plan.`} />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/subscriptions`} />
      </Head>
      <main className="pt-10 pb-14 flex flex-col gap-6">
        <div className="w-full text-center text-foreground flex flex-col gap-3">
          <p className="uppercase tracking-[0.2em] text-xs md:text-sm text-foreground/60">
            {t('subscriptions_membership_badge')}
          </p>
          <Heading level={1} className="text-3xl md:text-5xl">
            {featuredPlan?.title}
          </Heading>
          <p className="text-base md:text-xl text-foreground/80 max-w-xl mx-auto">
            {featuredPlan?.description}
          </p>
        </div>

        <section className="bg-neutral-light rounded-2xl border border-line p-5 md:p-7 text-foreground flex flex-col md:flex-row gap-5 md:gap-7">
          <div className="flex-1 flex flex-col gap-4">
            <span className="inline-flex w-fit rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-foreground">
              {t('subscriptions_single_plan_badge')}
            </span>
            <p className="text-lg leading-relaxed max-w-2xl">
              {featuredPlan?.description}
            </p>
            <div className="flex flex-col gap-3">
              {featuredPlanPerks?.map((perk) => (
                <div key={perk.title} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent-light text-accent-dark flex items-center justify-center mt-1 text-xs">
                    ✓
                  </span>
                  <div className="flex flex-col gap-1">
                    {perk.title.includes('<') ? (
                      <span
                        className="text-base leading-relaxed font-semibold"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeSubscriptionPerkHtml(perk.title),
                        }}
                      />
                    ) : (
                      <p className="text-base leading-relaxed font-semibold">
                        {perk.title}
                      </p>
                    )}
                    {perk.description ? (
                      perk.description.includes('<') ? (
                        <span
                          className="text-sm text-foreground/75 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeSubscriptionPerkHtml(perk.description),
                          }}
                        />
                      ) : (
                        <p className="text-sm text-foreground/75 leading-relaxed">
                          {perk.description}
                        </p>
                      )
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-px bg-line hidden md:block" />

          <div className="md:w-[220px] flex flex-col items-center justify-center gap-3">
            <p className="text-4xl md:text-5xl font-semibold leading-none">
              {formattedPrice}
            </p>
            <p className="text-base text-center">
              {t('subscriptions_summary_per_month')}
            </p>
            <button
              className="btn-primary text-sm px-5 py-2 whitespace-nowrap"
              onClick={() =>
                handleNext(
                  featuredPlan.priceId,
                  featuredPlan.tiersAvailable,
                  featuredPlan.slug,
                )
              }
            >
              {!isAuthenticated
                ? t('subscriptions_create_account_button')
                : userActivePlan?.priceId !== 'free'
                  ? t('subscriptions_manage_button')
                  : t('subscriptions_subscribe_button')}
            </button>
            <p className="text-sm text-foreground/70">
              {t('subscriptions_cancel_anytime')}
            </p>
          </div>
        </section>

        <section className="bg-neutral rounded-2xl border border-line p-5 md:p-6 text-foreground flex flex-col gap-3">
          <p className="uppercase tracking-[0.2em] text-xs text-foreground/70">
            {t('subscriptions_why_title')}
          </p>
          <p className="text-base leading-relaxed">
            {t('subscriptions_why_intro', { platformName: PLATFORM_NAME })}
          </p>
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/citizenship"
            className="btn text-sm px-5 py-2"
          >
            {t('subscriptions_become_citizen_button')}
          </Link>
          <button
            className="btn text-sm px-5 py-2"
            onClick={() =>
              handleNext(
                featuredPlan.priceId,
                featuredPlan.tiersAvailable,
                featuredPlan.slug,
              )
            }
          >
            {t('subscriptions_faq_cancel')}
          </button>
        </div>
      </main>
      <Webinar tags={['subscriptions-page']} analyticsCategory="Subscriptions" />
    </div>
  );
};

export default SubscriptionsPage;
