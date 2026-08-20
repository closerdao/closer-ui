import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef } from 'react';

import SubscriptionComparisonTable from '../../components/SubscriptionComparisonTable';
import SubscriptionEditorial from '../../components/SubscriptionEditorial';
import Webinar from '../../components/Webinar';
import { Heading } from '../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useActiveSubscription } from '../../hooks/useActiveSubscription';
import { useConfig } from '../../hooks/useConfig';
import { GeneralConfig } from '../../types';
import { PageMetaOverride } from '../../types/page';
import {
  SubscriptionPlan,
  SubscriptionsConfig,
} from '../../types/subscriptions';
import { resolveBlockText } from '../../utils/blockI18n';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { logMetric } from '../../utils/metrics';
import { getSiteUrl } from '../../utils/siteUrl';
import {
  fetchPageMetaOverride,
  resolvePageMeta,
} from '../../utils/standardPages';
import { getPaidSubscriptionPlans } from '../../utils/subscriptions.helpers';
import PageNotFound from '../not-found';

const SITE_URL = getSiteUrl();

interface Props {
  pageMeta?: PageMetaOverride | null;
}

const SubscriptionsPage: NextPage<Props> = ({ pageMeta }) => {
  const subscriptionsConfig = getCachedConfig(
    'subscriptions',
  ) as SubscriptionsConfig | null;
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const paymentConfig = getCachedConfig('payment') as {
    fiatCur?: string;
    utilityFiatCur?: string;
  } | null;
  const t = useTranslations();
  const { isAuthenticated, isLoading } = useAuth();
  const defaultConfig = useConfig();
  const PLATFORM_NAME =
    generalConfig?.platformName || defaultConfig.platformName;
  const currency =
    paymentConfig?.fiatCur || paymentConfig?.utilityFiatCur || 'EUR';

  const router = useRouter();

  const meta = resolvePageMeta(pageMeta, {
    title: `${t('subscriptions_title')} - ${PLATFORM_NAME}`,
    description: `Join ${PLATFORM_NAME} with a subscription plan. Support our community and get access to exclusive benefits and features.`,
  });
  const title = resolveBlockText(meta.title, t);
  const description = resolveBlockText(meta.description, t);

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';

  const plans = useMemo(
    () => getPaidSubscriptionPlans(subscriptionsConfig),
    [subscriptionsConfig],
  );
  const { userActivePlan, hasActiveSubscription, openCustomerPortal } =
    useActiveSubscription(plans);
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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    let priceId = plan.priceId;
    if (priceId?.includes(',')) {
      priceId = priceId.split(',')[0];
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
      return;
    }

    if (hasActiveSubscription) {
      await openCustomerPortal();
      return;
    }

    void logMetric({
      event: 'subscribe-button-click',
      category: 'subscriptions',
      value: 'subscribe',
    });
    router.push(`/subscriptions/summary?priceId=${priceId}`);
  };

  const getCtaLabel = (_plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      return t('subscriptions_create_account_button');
    }
    if (hasActiveSubscription) {
      return t('subscriptions_manage_button');
    }
    return t('subscriptions_subscribe_button');
  };

  if (isLoading) {
    return null;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  if (!plans.length) {
    return <PageNotFound error="" />;
  }

  const singlePlan = plans.length === 1 ? plans[0] : null;

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta
          name="keywords"
          content={`${PLATFORM_NAME}, subscriptions, membership, community membership, regenerative communities`}
        />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {SITE_URL && (
          <meta property="og:url" content={`${SITE_URL}/subscriptions`} />
        )}
        {meta.ogImage ? (
          <meta property="og:image" content={meta.ogImage} />
        ) : null}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {meta.ogImage ? (
          <meta name="twitter:image" content={meta.ogImage} />
        ) : null}
        {SITE_URL && (
          <link rel="canonical" href={`${SITE_URL}/subscriptions`} />
        )}
      </Head>
      <main className="pt-10 pb-14 flex flex-col gap-6">
        <div className="w-full text-center text-foreground flex flex-col gap-3">
          <p className="uppercase tracking-[0.2em] text-xs md:text-sm text-foreground/60">
            {t('subscriptions_membership_badge')}
          </p>
          <Heading level={1} className="text-3xl md:text-5xl">
            {singlePlan ? singlePlan.title : t('subscriptions_compare_heading')}
          </Heading>
          <p className="text-base md:text-xl text-foreground/80 max-w-xl mx-auto">
            {singlePlan
              ? singlePlan.description
              : t('subscriptions_compare_intro')}
          </p>
        </div>

        {singlePlan ? (
          <SubscriptionEditorial
            plan={singlePlan}
            currency={currency}
            ctaLabel={getCtaLabel(singlePlan)}
            onSubscribe={handleSubscribe}
          />
        ) : (
          <SubscriptionComparisonTable
            plans={plans}
            currency={currency}
            activePriceId={userActivePlan?.priceId}
            getCtaLabel={getCtaLabel}
            onSubscribe={handleSubscribe}
          />
        )}

        <section className="bg-neutral rounded-2xl border border-line p-5 md:p-6 text-foreground flex flex-col gap-3">
          <p className="uppercase tracking-[0.2em] text-xs text-foreground/70">
            {t('subscriptions_why_title')}
          </p>
          <p className="text-base leading-relaxed">
            {t('subscriptions_why_intro', { platformName: PLATFORM_NAME })}
          </p>
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          {process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' && (
            <Link href="/citizenship" className="btn text-sm px-5 py-2">
              {t('subscriptions_become_citizen_button')}
            </Link>
          )}
          {hasActiveSubscription ? (
            <button
              className="btn text-sm px-5 py-2"
              onClick={() => void openCustomerPortal()}
            >
              {t('subscriptions_faq_cancel')}
            </button>
          ) : (
            <p className="text-sm text-foreground/70 self-center">
              {t('subscriptions_cancel_help')}
            </p>
          )}
        </div>
      </main>
      <Webinar
        tags={['subscriptions-page']}
        analyticsCategory="Subscriptions"
      />
    </div>
  );
};

SubscriptionsPage.getInitialProps = async (_context: NextPageContext) => {
  const pageMeta = await fetchPageMetaOverride('/subscriptions');
  return { pageMeta };
};

export default SubscriptionsPage;
