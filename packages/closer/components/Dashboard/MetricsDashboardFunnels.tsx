import { useTranslations } from 'next-intl';

import MetricsFunnelCard from './MetricsFunnelCard';

import type {
  BookingFunnelResults,
  CitizenshipLikeFunnelResults,
  FundraiserFunnelResults,
  SignupFunnelResults,
  SubscriptionsFunnelResults,
  TokenFunnelResults,
} from '../../types/metricsDashboard';

import { Heading } from '../ui';

type Props = {
  tokenFunnel: TokenFunnelResults;
  bookingFunnel: BookingFunnelResults;
  subscriptionsFunnel: SubscriptionsFunnelResults;
  citizenshipFunnel: CitizenshipLikeFunnelResults;
  coHousingFunnel: CitizenshipLikeFunnelResults;
  signupFunnel: SignupFunnelResults;
  fundraiserFunnel: FundraiserFunnelResults;
};

function pct(n: number, d: number): string | undefined {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return undefined;
  return `${Math.min(100, Math.round((100 * n) / d))}%`;
}

const PAL = {
  token: { from: '#7c3aed', to: '#a78bfa' },
  booking: { from: '#0284c7', to: '#38bdf8' },
  subscriptions: { from: '#059669', to: '#34d399' },
  citizenship: { from: '#c026d3', to: '#e879f9' },
  cohousing: { from: '#ea580c', to: '#fb923c' },
  signup: { from: '#4f46e5', to: '#818cf8' },
  fundraiser: { from: '#b45309', to: '#fbbf24' },
};

const MetricsDashboardFunnels = ({
  tokenFunnel,
  bookingFunnel,
  subscriptionsFunnel,
  citizenshipFunnel,
  coHousingFunnel,
  signupFunnel,
  fundraiserFunnel,
}: Props) => {
  const t = useTranslations();

  return (
    <section className="flex flex-col gap-4">
      <Heading level={3} className="!mb-0">
        {t('metrics_dashboard_section_funnels')}
      </Heading>
      <p className="text-sm text-gray-500 -mt-1 max-w-3xl">
        {t('metrics_dashboard_funnels_intro')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <MetricsFunnelCard
          title={t('metrics_funnel_token_title')}
          barFrom={PAL.token.from}
          barTo={PAL.token.to}
          badge={pct(tokenFunnel.success, tokenFunnel.tokenPageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_token_tokenPageViews'),
              value: tokenFunnel.tokenPageViews,
            },
            {
              label: t('metrics_funnel_token_calculator'),
              value: tokenFunnel.calculator,
            },
            {
              label: t('metrics_funnel_token_checkout'),
              value: tokenFunnel.checkout,
            },
            {
              label: t('metrics_funnel_token_success'),
              value: tokenFunnel.success,
            },
            {
              label: t('metrics_funnel_token_tokensSoldPointSum'),
              value: tokenFunnel.tokensSoldPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_booking_title')}
          barFrom={PAL.booking.from}
          barTo={PAL.booking.to}
          badge={pct(bookingFunnel.completionSignals, bookingFunnel.pageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_booking_availabilityChecks'),
              value: bookingFunnel.availabilityChecks,
            },
            {
              label: t('metrics_funnel_booking_pageViews'),
              value: bookingFunnel.pageViews,
            },
            {
              label: t('metrics_funnel_booking_listingViews'),
              value: bookingFunnel.listingViews,
            },
            {
              label: t('metrics_funnel_booking_intentOrFlow'),
              value: bookingFunnel.intentOrFlow,
            },
            {
              label: t('metrics_funnel_booking_completionSignals'),
              value: bookingFunnel.completionSignals,
            },
            {
              label: t('metrics_funnel_booking_categoryTotal'),
              value: bookingFunnel.categoryTotal,
            },
            {
              label: t('metrics_funnel_booking_categoryPointSum'),
              value: bookingFunnel.categoryPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_subscriptions_title')}
          barFrom={PAL.subscriptions.from}
          barTo={PAL.subscriptions.to}
          badge={pct(
            subscriptionsFunnel.completionSignals,
            subscriptionsFunnel.subscriptionsPageViews,
          )}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_subscriptions_stripeFirstPayment'),
              value: subscriptionsFunnel.stripeFirstPayment,
            },
            {
              label: t('metrics_funnel_subscriptions_subscriptionsPageViews'),
              value: subscriptionsFunnel.subscriptionsPageViews,
            },
            {
              label: t('metrics_funnel_subscriptions_subscriptionsCategoryTotal'),
              value: subscriptionsFunnel.subscriptionsCategoryTotal,
            },
            {
              label: t('metrics_funnel_subscriptions_checkoutOrSubscribe'),
              value: subscriptionsFunnel.checkoutOrSubscribe,
            },
            {
              label: t('metrics_funnel_subscriptions_completionSignals'),
              value: subscriptionsFunnel.completionSignals,
            },
            {
              label: t('metrics_funnel_subscriptions_engagementSubscriptionTouch'),
              value: subscriptionsFunnel.engagementSubscriptionTouch,
            },
            {
              label: t('metrics_funnel_subscriptions_subscriptionsPointSum'),
              value: subscriptionsFunnel.subscriptionsPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_citizenship_title')}
          barFrom={PAL.citizenship.from}
          barTo={PAL.citizenship.to}
          badge={pct(citizenshipFunnel.milestones, citizenshipFunnel.pageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_citizenship_pageViews'),
              value: citizenshipFunnel.pageViews,
            },
            {
              label: t('metrics_funnel_citizenship_applicationFlow'),
              value: citizenshipFunnel.applicationFlow,
            },
            {
              label: t('metrics_funnel_citizenship_milestones'),
              value: citizenshipFunnel.milestones,
            },
            {
              label: t('metrics_funnel_citizenship_categoryTotal'),
              value: citizenshipFunnel.categoryTotal,
            },
            {
              label: t('metrics_funnel_citizenship_categoryPointSum'),
              value: citizenshipFunnel.categoryPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_cohousing_title')}
          barFrom={PAL.cohousing.from}
          barTo={PAL.cohousing.to}
          badge={pct(coHousingFunnel.milestones, coHousingFunnel.pageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_cohousing_pageViews'),
              value: coHousingFunnel.pageViews,
            },
            {
              label: t('metrics_funnel_cohousing_applicationFlow'),
              value: coHousingFunnel.applicationFlow,
            },
            {
              label: t('metrics_funnel_cohousing_milestones'),
              value: coHousingFunnel.milestones,
            },
            {
              label: t('metrics_funnel_cohousing_categoryTotal'),
              value: coHousingFunnel.categoryTotal,
            },
            {
              label: t('metrics_funnel_cohousing_categoryPointSum'),
              value: coHousingFunnel.categoryPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_signup_title')}
          barFrom={PAL.signup.from}
          barTo={PAL.signup.to}
          badge={pct(signupFunnel.verifyOrActivate, signupFunnel.pageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_signup_pageViews'),
              value: signupFunnel.pageViews,
            },
            {
              label: t('metrics_funnel_signup_formOrRegister'),
              value: signupFunnel.formOrRegister,
            },
            {
              label: t('metrics_funnel_signup_submitOrCreate'),
              value: signupFunnel.submitOrCreate,
            },
            {
              label: t('metrics_funnel_signup_verifyOrActivate'),
              value: signupFunnel.verifyOrActivate,
            },
            {
              label: t('metrics_funnel_signup_categoryTotal'),
              value: signupFunnel.categoryTotal,
            },
            {
              label: t('metrics_funnel_signup_categoryPointSum'),
              value: signupFunnel.categoryPointSum,
            },
          ]}
        />
        <MetricsFunnelCard
          title={t('metrics_funnel_fundraiser_title')}
          barFrom={PAL.fundraiser.from}
          barTo={PAL.fundraiser.to}
          badge={pct(fundraiserFunnel.successSignals, fundraiserFunnel.pageViews)}
          badgeTitle={t('metrics_funnel_badge_conversion')}
          steps={[
            {
              label: t('metrics_funnel_fundraiser_pageViews'),
              value: fundraiserFunnel.pageViews,
            },
            {
              label: t('metrics_funnel_fundraiser_donateIntent'),
              value: fundraiserFunnel.donateIntent,
            },
            {
              label: t('metrics_funnel_fundraiser_paymentFlow'),
              value: fundraiserFunnel.paymentFlow,
            },
            {
              label: t('metrics_funnel_fundraiser_successSignals'),
              value: fundraiserFunnel.successSignals,
            },
            {
              label: t('metrics_funnel_fundraiser_categoryTotal'),
              value: fundraiserFunnel.categoryTotal,
            },
            {
              label: t('metrics_funnel_fundraiser_categoryPointSum'),
              value: fundraiserFunnel.categoryPointSum,
            },
          ]}
        />
      </div>
    </section>
  );
};

export default MetricsDashboardFunnels;
