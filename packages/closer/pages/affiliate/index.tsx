import Head from 'next/head';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import CollapsibleFaq from '../../components/CollapsibleFaq';
import { Button, Heading, Input } from '../../components/ui';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { Textarea } from '../../components/ui/textarea';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { AffiliateConfig, GeneralConfig } from '../../types/api';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import { logMetric } from '../../utils/metrics';
import { reportIssue } from '../../utils/reporting.utils';
import PageNotFound from '../not-found';

/**
 * Program terms that are the same for every platform running Closer. The
 * commission rates below them are per-platform and come from the `affiliate`
 * config bucket, so nothing on this page names a particular community.
 */
const ATTRIBUTION_WINDOW_MONTHS = 12;
const PAYOUT_THRESHOLD_EUR = 100;

const AffiliateLandingPage = () => {
  const t = useTranslations();
  const { user, refetchUser } = useAuth();
  const router = useRouter();

  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const affiliateConfig = getCachedConfig('affiliate') as AffiliateConfig | null;

  const platform =
    generalConfig?.platformName || defaultConfig?.PLATFORM_NAME || 'Closer';
  const contactEmail =
    generalConfig?.teamEmail || defaultConfig?.TEAM_EMAIL || '';
  const payoutThreshold = formatIsoFiatAmount(PAYOUT_THRESHOLD_EUR, 'EUR');

  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [audience, setAudience] = useState('');

  const reasonRef = useRef<HTMLTextAreaElement>(null);

  const applicationStatus = user?.affiliateApplication?.status;
  // Approval is what grants `affiliate` - until then the application only waits.
  const isPendingReview = !user?.affiliate && applicationStatus === 'pending';

  useEffect(() => {
    void logMetric({
      event: 'affiliate-page-view',
      category: 'affiliate',
      value: 'view',
      number: 1,
    });
  }, [user?._id]);

  // The form opens inside the hero, so the closing CTA at the foot of the page
  // has to bring the reader back up to it.
  useEffect(() => {
    if (!isFormOpen) return;
    reasonRef.current?.scrollIntoView({ block: 'center' });
    reasonRef.current?.focus();
  }, [isFormOpen]);

  // Only rates the platform actually pays are worth a card - a community that
  // sells no tokens should not advertise a token commission.
  const commissionRates = [
    {
      label: t('affiliate_landing_rate_stays'),
      percent: affiliateConfig?.staysCommissionPercent,
    },
    {
      label: t('affiliate_landing_rate_events'),
      percent: affiliateConfig?.eventsCommissionPercent,
    },
    {
      label: t('affiliate_landing_rate_subscriptions'),
      percent: affiliateConfig?.subscriptionCommissionPercent,
    },
    {
      label: t('affiliate_landing_rate_products'),
      percent: affiliateConfig?.productsCommissionPercent,
    },
    {
      label: t('affiliate_landing_rate_tokens'),
      percent: affiliateConfig?.tokenSaleCommissionPercent,
    },
  ].filter((rate) => Number(rate.percent) > 0);

  const steps = [
    {
      number: '01',
      title: t('affiliate_landing_step_1_title'),
      body: t('affiliate_landing_step_1_body'),
    },
    {
      number: '02',
      title: t('affiliate_landing_step_2_title'),
      body: t('affiliate_landing_step_2_body', { platform }),
    },
    {
      number: '03',
      title: t('affiliate_landing_step_3_title'),
      body: t('affiliate_landing_step_3_body', { amount: payoutThreshold }),
    },
  ];

  const benefits = [
    {
      icon: '💸',
      title: t('affiliate_landing_benefit_commissions_title'),
      body: t('affiliate_landing_benefit_commissions_body', {
        months: ATTRIBUTION_WINDOW_MONTHS,
      }),
    },
    {
      icon: '📊',
      title: t('affiliate_landing_benefit_dashboard_title'),
      body: t('affiliate_landing_benefit_dashboard_body'),
    },
    {
      icon: '🎨',
      title: t('affiliate_landing_benefit_materials_title'),
      body: t('affiliate_landing_benefit_materials_body'),
    },
    {
      icon: '🌱',
      title: t('affiliate_landing_benefit_impact_title'),
      body: t('affiliate_landing_benefit_impact_body', { platform }),
    },
  ];

  const rules = [
    t('affiliate_landing_rule_tracking'),
    t('affiliate_landing_rule_spam'),
    t('affiliate_landing_rule_disclose'),
    t('affiliate_landing_rule_brand', { platform }),
    t('affiliate_landing_rule_bidding', { platform }),
    t('affiliate_landing_rule_reselling'),
    t('affiliate_landing_rule_coupons'),
    t('affiliate_landing_rule_breach'),
  ];

  const faqs = [
    {
      question: t('affiliate_landing_faq_link_q'),
      answer: t('affiliate_landing_faq_link_a'),
    },
    {
      question: t('affiliate_landing_faq_window_q'),
      answer: t('affiliate_landing_faq_window_a', {
        months: ATTRIBUTION_WINDOW_MONTHS,
      }),
    },
    {
      question: t('affiliate_landing_faq_payout_q'),
      answer: t('affiliate_landing_faq_payout_a', { amount: payoutThreshold }),
    },
    {
      question: t('affiliate_landing_faq_coupon_q'),
      answer: t('affiliate_landing_faq_coupon_a'),
    },
    ...(contactEmail
      ? [
          {
            question: t('affiliate_landing_faq_contact_q'),
            answer: t('affiliate_landing_faq_contact_a', {
              email: contactEmail,
            }),
          },
        ]
      : []),
  ];

  const startApplication = () => {
    if (user?.affiliate) {
      router.push('/settings/affiliate');
      return;
    }

    if (!user?._id) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setError(null);
    setIsFormOpen(true);
  };

  const applyToProgram = async () => {
    if (!reason.trim()) {
      setError(t('affiliate_landing_apply_reason_required'));
      return;
    }

    try {
      setIsApiLoading(true);
      setError(null);
      setSuccess(false);

      // `program` is what tells the reviewer which page an application came
      // from - /affiliate and /ambassadors share one queue.
      await api.post('/affiliates/apply', {
        reason: reason.trim(),
        program: 'affiliate',
        ...(audience.trim() && { audience: audience.trim() }),
      });

      // The application lands on the user record, so the pending state below
      // survives a reload rather than living only in this component.
      await refetchUser();

      void logMetric({
        event: 'affiliate-signup',
        category: 'affiliate',
        value: 'application',
        number: 1,
      });

      setIsFormOpen(false);
      setSuccess(true);
    } catch (error) {
      const errorMessage = parseMessageFromError(error);
      setError(errorMessage);
      console.error('Error submitting affiliate application:', error);
      reportIssue(
        `Error submitting affiliate application: ${user?._id}`,
        user?.email,
      );
    } finally {
      setIsApiLoading(false);
    }
  };

  if (process.env.NEXT_PUBLIC_FEATURE_AFFILIATE !== 'true') {
    return <PageNotFound />;
  }

  const hasApplied = success || isPendingReview;
  const pageTitle = t('affiliate_landing_page_title', { platform });

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={t('affiliate_landing_hero_intro', {
            platform,
            months: ATTRIBUTION_WINDOW_MONTHS,
          })}
        />
      </Head>

      <div className="w-full text-foreground">
        {/* HERO */}
        <section className="px-4 sm:px-6 pt-10 pb-14 md:pt-16 md:pb-20 bg-gradient-to-b from-accent-light to-transparent rounded-b-[32px]">
          <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-5">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent bg-background/80 border border-accent/20 rounded-full px-4 py-1.5">
              {t('affiliate_landing_hero_eyebrow')}
            </span>

            <Heading
              level={1}
              className="text-4xl md:text-5xl leading-[1.1] font-bold"
            >
              {t('affiliate_landing_hero_title')}{' '}
              <span className="text-accent">
                {t('affiliate_landing_hero_accent')}
              </span>
            </Heading>

            <p className="text-lg text-foreground/70 max-w-xl leading-relaxed">
              {t('affiliate_landing_hero_intro', {
                platform,
                months: ATTRIBUTION_WINDOW_MONTHS,
              })}
            </p>

            {error && (
              <div className="w-full max-w-lg text-left">
                <ErrorMessage error={error} />
              </div>
            )}

            {user?.affiliate ? (
              <Button
                onClick={() => router.push('/settings/affiliate')}
                variant="primary"
                color="accent"
                className="max-w-xs"
              >
                {t('affiliate_landing_cta_dashboard')}
              </Button>
            ) : hasApplied ? (
              <div className="w-full max-w-lg bg-background border border-accent/20 rounded-2xl shadow-xl p-8">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground text-xl font-bold flex items-center justify-center mx-auto">
                  ✓
                </div>
                <Heading level={2} className="text-xl mt-4">
                  {t('affiliate_landing_success_title')}
                </Heading>
                <p className="text-sm text-foreground/70 mt-2">
                  {t('affiliate_landing_success_body', {
                    email: user?.email || '',
                  })}
                </p>
              </div>
            ) : isFormOpen ? (
              <div className="w-full max-w-lg bg-background border border-accent/20 rounded-2xl shadow-xl p-6 md:p-8 text-left flex flex-col gap-4">
                <Heading level={2} className="text-xl">
                  {t('affiliate_landing_apply_title')}
                </Heading>
                <div className="flex flex-col gap-1">
                  <label
                    className="font-bold text-sm"
                    htmlFor="affiliate-reason"
                  >
                    {t('affiliate_landing_apply_reason_label')}
                  </label>
                  <Textarea
                    id="affiliate-reason"
                    ref={reasonRef}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={t('affiliate_landing_apply_reason_placeholder', {
                      platform,
                    })}
                  />
                </div>
                <Input
                  id="affiliate-audience"
                  label={t('affiliate_landing_apply_audience_label', {
                    platform,
                  })}
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder={t(
                    'affiliate_landing_apply_audience_placeholder',
                  )}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setIsFormOpen(false)}
                    variant="secondary"
                    color="accent"
                    isFullWidth={false}
                    isEnabled={!isApiLoading}
                  >
                    {t('affiliate_landing_apply_cancel')}
                  </Button>
                  <Button
                    onClick={applyToProgram}
                    variant="primary"
                    color="accent"
                    isFullWidth={false}
                    isLoading={isApiLoading}
                    isEnabled={!isApiLoading && Boolean(reason.trim())}
                  >
                    {t('affiliate_landing_apply_submit')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={startApplication}
                  variant="primary"
                  color="accent"
                  className="max-w-xs"
                  isEnabled={!isApiLoading}
                >
                  {t('affiliate_landing_cta_apply')}
                </Button>
                <p className="text-sm text-foreground/60">
                  {t('affiliate_landing_hero_footnote')}
                </p>
              </>
            )}
          </div>
        </section>

        {/* COMMISSION RATES */}
        {commissionRates.length > 0 && (
          <section className="px-4 sm:px-6 py-14 md:py-20">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
              <div className="text-center flex flex-col gap-3">
                <Heading level={2} className="text-2xl md:text-3xl">
                  {t('affiliate_landing_rates_title')}
                </Heading>
                <p className="text-foreground/70">
                  {t('affiliate_landing_rates_note', { platform })}
                </p>
              </div>

              {/* Flex rather than grid so an odd number of rates - which is
                  what most platforms have - centres its last row. */}
              <div className="flex flex-wrap justify-center gap-4">
                {commissionRates.map((rate) => (
                  <div
                    key={rate.label}
                    className="bg-background border border-line/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-1 text-center shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-0.75rem)] grow-0"
                  >
                    <p className="text-4xl font-bold text-accent">
                      {rate.percent}%
                    </p>
                    <p className="font-medium text-sm md:text-base">
                      {rate.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section className="px-4 sm:px-6 py-14 md:py-20 bg-neutral-light">
          <div className="max-w-5xl mx-auto flex flex-col gap-10">
            <div className="text-center flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                {t('affiliate_landing_steps_eyebrow')}
              </p>
              <Heading level={2} className="text-2xl md:text-3xl">
                {t('affiliate_landing_steps_title')}
              </Heading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative bg-background border border-line/40 rounded-2xl p-7 pt-9"
                >
                  <span className="absolute -top-4 left-6 bg-accent text-accent-foreground rounded-full w-9 h-9 flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </span>
                  <Heading level={3} className="text-lg mb-2">
                    {step.title}
                  </Heading>
                  <p className="text-foreground/70 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY JOIN */}
        <section className="px-4 sm:px-6 py-14 md:py-20">
          <div className="max-w-5xl mx-auto flex flex-col gap-10">
            <div className="text-center flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                {t('affiliate_landing_benefits_eyebrow')}
              </p>
              <Heading level={2} className="text-2xl md:text-3xl">
                {t('affiliate_landing_benefits_title', { platform })}
              </Heading>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-accent-light/40 border border-accent/15 rounded-2xl p-7 flex gap-4"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {benefit.icon}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <Heading level={3} className="text-lg">
                      {benefit.title}
                    </Heading>
                    <p className="text-foreground/70 leading-relaxed">
                      {benefit.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RULES */}
        <section className="px-4 sm:px-6 py-14 md:py-20 bg-neutral-light">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <div className="text-center flex flex-col gap-3">
              <Heading level={2} className="text-2xl md:text-3xl">
                {t('affiliate_landing_rules_title')}
              </Heading>
              <p className="text-foreground/70">
                {t('affiliate_landing_rules_intro')}
              </p>
            </div>

            <ul className="bg-background border border-line/40 rounded-2xl divide-y divide-line/30">
              {rules.map((rule) => (
                <li
                  key={rule}
                  className="flex gap-3 px-6 py-4 text-foreground/80 leading-relaxed"
                >
                  <span className="text-accent font-bold" aria-hidden="true">
                    →
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 sm:px-6 py-14 md:py-20">
          <div className="max-w-3xl mx-auto">
            <CollapsibleFaq
              title={t('affiliate_landing_faq_title')}
              items={faqs}
            />
          </div>
        </section>

        {/* CLOSING CTA */}
        {!user?.affiliate && !hasApplied && (
          <section className="px-4 sm:px-6 pb-16 md:pb-24">
            <div className="max-w-4xl mx-auto bg-accent-light rounded-3xl px-6 py-14 text-center flex flex-col items-center gap-5">
              <Heading level={2} className="text-2xl md:text-4xl max-w-xl">
                {t('affiliate_landing_closing_title', { platform })}
              </Heading>
              <p className="text-foreground/70 max-w-md">
                {t('affiliate_landing_closing_body')}
              </p>
              <Button
                onClick={startApplication}
                variant="primary"
                color="accent"
                className="max-w-xs"
                isEnabled={!isApiLoading}
              >
                {t('affiliate_landing_cta_apply_short')}
              </Button>
              {contactEmail && (
                <p className="text-sm text-foreground/60">
                  {t('affiliate_landing_contact')}{' '}
                  <a
                    className="text-accent font-medium underline underline-offset-2"
                    href={`mailto:${contactEmail}`}
                  >
                    {contactEmail}
                  </a>
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default AffiliateLandingPage;
