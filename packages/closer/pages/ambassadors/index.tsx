import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import AmbassadorBadge from '../../components/AmbassadorBadge';
import {
  Eyebrow,
  Panel,
  btnPrimary,
  btnSecondary,
  btnSmall,
} from '../../components/VillageUI';
import { ErrorMessage, Input } from '../../components/ui';
import { Textarea } from '../../components/ui/textarea';

import { useTranslations } from 'next-intl';

import {
  AMBASSADOR_ROLE,
  PLATFORM_SETUP_FEE_EUR,
  PLATFORM_SUBSCRIPTION_PRICE_EUR,
} from '../../constants/village.constants';
import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import { logMetric } from '../../utils/metrics';
import { reportIssue } from '../../utils/reporting.utils';

const AmbassadorLandingPage = () => {
  const t = useTranslations();
  const { user, refetchUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [projects, setProjects] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const isAmbassador = Boolean(
    user?.affiliate || user?.roles?.includes(AMBASSADOR_ROLE),
  );
  // Applying no longer grants anything - approval from /dashboard/affiliate does.
  const isPendingReview =
    !isAmbassador && user?.affiliateApplication?.status === 'pending';

  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // The form opens in the hero, so the closing CTA at the foot of the page has
  // to bring the reader back up to it.
  useEffect(() => {
    if (!isFormOpen) return;
    reasonRef.current?.scrollIntoView({ block: 'center' });
    reasonRef.current?.focus();
  }, [isFormOpen]);

  const startApplication = () => {
    if (!isAuthenticated) {
      router.push('/login?back=/ambassadors');
      return;
    }

    if (isAmbassador) {
      router.push('/settings/affiliate');
      return;
    }

    setError(null);
    setIsFormOpen(true);
  };

  const applyToProgram = async () => {
    if (!reason.trim()) {
      setError(t('ambassadors_apply_reason_required'));
      return;
    }

    try {
      setIsApiLoading(true);
      setError(null);

      // `program` is what tells the reviewer which page an application came
      // from - /affiliate and /ambassadors share one queue.
      await api.post('/affiliates/apply', {
        reason: reason.trim(),
        program: 'ambassador',
        ...(projects.trim() && { projects: projects.trim() }),
      });
      await refetchUser();

      void logMetric({
        event: 'ambassador-signup',
        category: 'affiliate',
        value: 'application',
        number: 1,
      });

      setIsFormOpen(false);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      reportIssue(
        `Error submitting ambassador application: ${user?._id}`,
        user?.email,
      );
      setError(t('ambassadors_error_signup'));
    } finally {
      setIsApiLoading(false);
    }
  };

  const steps = [
    {
      n: t('ambassadors_step_1_label'),
      title: t('ambassadors_step_1_title'),
      body: t('ambassadors_step_1_body'),
    },
    {
      n: t('ambassadors_step_2_label'),
      title: t('ambassadors_step_2_title'),
      body: t('ambassadors_step_2_body'),
    },
    {
      n: t('ambassadors_step_3_label'),
      title: t('ambassadors_step_3_title'),
      body: t('ambassadors_step_3_body'),
    },
  ];

  const earnings = [
    t('ambassadors_earn_stays'),
    t('ambassadors_earn_events'),
    t('ambassadors_earn_subscriptions'),
    t('ambassadors_earn_tokens'),
    t('ambassadors_earn_products'),
  ];

  const faqs = [
    {
      question: t('ambassadors_faq_rewards_q'),
      answer: t('ambassadors_faq_rewards_a'),
    },
    {
      question: t('ambassadors_faq_map_q'),
      answer: t('ambassadors_faq_map_a'),
    },
    {
      question: t('ambassadors_faq_deploy_q'),
      answer: t('ambassadors_faq_deploy_a'),
    },
  ];

  return (
    <>
      <Head>
        <title>{t('ambassadors_page_title')}</title>
      </Head>

      <div className="bg-[#FCFDFB] text-[#10201A]">
        {/* HERO */}
        <section className="relative overflow-hidden px-6 py-20 md:py-24 bg-[radial-gradient(circle_620px_at_50%_-200px,rgba(62,224,143,0.26),transparent)]">
          <div className="max-w-3xl mx-auto text-center">
            {isAmbassador ? (
              <div className="flex justify-center mb-5">
                <AmbassadorBadge size="md" />
              </div>
            ) : (
              <Eyebrow>{t('ambassadors_hero_eyebrow')}</Eyebrow>
            )}

            <h1 className="font-serif text-5xl md:text-6xl leading-[1.06] tracking-[-0.01em] mt-4">
              {t('ambassadors_hero_title')}{' '}
              <em className="italic text-[#0FA968]">
                {t('ambassadors_hero_accent')}
              </em>
            </h1>

            <p className="text-[17px] text-[#5C6E64] max-w-xl mx-auto mt-6 leading-relaxed">
              {t('ambassadors_page_intro')}
            </p>

            {success || isPendingReview ? (
              <div className="mt-9 animate-fade-in-up rounded-[22px] border border-[#C2F0DA] bg-white p-8 max-w-lg mx-auto shadow-[0_14px_36px_rgba(15,169,104,0.12)]">
                <div className="w-12 h-12 rounded-full bg-[#3EE08F] text-[#07351F] text-xl font-bold flex items-center justify-center mx-auto animate-checkmark-pop">
                  ✓
                </div>
                <h2 className="font-serif text-2xl mt-5">
                  {t('ambassadors_signup_success_title')}
                </h2>
                <p className="text-[14.5px] text-[#5C6E64] mt-2.5">
                  {t('ambassadors_signup_success')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
                  <Link href="/map" className={btnSecondary}>
                    {t('ambassadors_cta_map')}
                  </Link>
                </div>
              </div>
            ) : isAmbassador ? (
              <div className="mt-9 rounded-[22px] border border-[#C2F0DA] bg-white p-7 md:p-8 max-w-2xl mx-auto text-left shadow-[0_10px_30px_rgba(15,169,104,0.08)]">
                <Eyebrow>{t('ambassadors_toolkit_eyebrow')}</Eyebrow>
                <h2 className="font-serif text-2xl mt-2.5">
                  {t('ambassadors_toolkit_title')}
                </h2>
                <p className="text-[14.5px] text-[#5C6E64] mt-2">
                  {t('ambassadors_toolkit_body')}
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Link href="/villages/create" className={btnPrimary}>
                    {t('ambassadors_toolkit_add_village')}
                  </Link>
                  <Link href="/settings/affiliate" className={btnSecondary}>
                    {t('ambassadors_cta_dashboard')}
                  </Link>
                  {user?.slug ? (
                    <Link
                      href={`/ambassadors/${user.slug}`}
                      className={btnSecondary}
                    >
                      {t('ambassadors_toolkit_profile')}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : isFormOpen ? (
              <div className="mt-9 rounded-[22px] border border-[#C2F0DA] bg-white p-7 md:p-8 max-w-2xl mx-auto text-left shadow-[0_10px_30px_rgba(15,169,104,0.08)]">
                <h2 className="font-serif text-2xl">
                  {t('ambassadors_apply_title')}
                </h2>
                <div className="flex flex-col gap-4 mt-5">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[13.5px] font-semibold"
                      htmlFor="ambassador-reason"
                    >
                      {t('ambassadors_apply_reason_label')}
                    </label>
                    <Textarea
                      id="ambassador-reason"
                      ref={reasonRef}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder={t('ambassadors_apply_reason_placeholder')}
                    />
                  </div>
                  <Input
                    id="ambassador-projects"
                    label={t('ambassadors_apply_projects_label')}
                    value={projects}
                    onChange={(event) => setProjects(event.target.value)}
                    placeholder={t('ambassadors_apply_projects_placeholder')}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={applyToProgram}
                      disabled={isApiLoading || !reason.trim()}
                      className={btnPrimary}
                    >
                      {isApiLoading
                        ? t('ambassadors_cta_joining')
                        : t('ambassadors_apply_submit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      disabled={isApiLoading}
                      className={btnSecondary}
                    >
                      {t('ambassadors_apply_cancel')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
                  <button
                    type="button"
                    onClick={startApplication}
                    disabled={isApiLoading}
                    className={btnPrimary}
                  >
                    {t('ambassadors_cta_join')}
                  </button>
                  <Link href="/map" className={btnSecondary}>
                    {t('ambassadors_cta_map')}
                  </Link>
                </div>
                <p className="mt-5 text-[13.5px] text-[#5C6E64]">
                  {t('ambassadors_hero_footnote')}
                </p>
              </>
            )}

            {error ? (
              <div className="mt-6 max-w-lg mx-auto text-left">
                <ErrorMessage error={error} />
              </div>
            ) : null}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-[#E2FAEE] py-20 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <Eyebrow>{t('ambassadors_steps_eyebrow')}</Eyebrow>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">
                {t('ambassadors_steps_title')}{' '}
                <em className="italic text-[#0FA968]">
                  {t('ambassadors_steps_accent')}
                </em>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="relative bg-white border border-[#C2F0DA] rounded-[22px] p-8 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,169,104,0.14)] transition-all"
                >
                  <div className="absolute -top-4 left-7 bg-[#3EE08F] text-[#0E1E16] rounded-full px-4 py-1 font-bold text-[13.5px] shadow-[0_4px_12px_rgba(62,224,143,0.4)]">
                    {step.n}
                  </div>
                  <h3 className="font-serif text-xl mt-2 mb-2.5">
                    {step.title}
                  </h3>
                  <p className="text-[14.5px] text-[#5C6E64] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT YOU EARN / WHAT YOU DO */}
        <section className="py-20 md:py-24 px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel
              eyebrow={t('ambassadors_rewards_title')}
              title={t('ambassadors_rewards_headline')}
              description={t('ambassadors_rewards_body')}
            >
              <ul className="flex flex-wrap gap-2">
                {earnings.map((item) => (
                  <li
                    key={item}
                    className="text-[13px] font-medium text-[#0B7A4C] bg-[#F3FCF7] border border-[#C2F0DA] rounded-full px-3.5 py-1.5"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/settings/affiliate"
                className="inline-block mt-6 text-[13.5px] font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
              >
                {t('ambassadors_rewards_link')} →
              </Link>
            </Panel>

            <Panel
              eyebrow={t('ambassadors_responsibilities_title')}
              title={t('ambassadors_responsibilities_headline')}
            >
              <ul className="list-none">
                {[
                  t('ambassadors_responsibility_1'),
                  t('ambassadors_responsibility_2'),
                  t('ambassadors_responsibility_3'),
                ].map((item) => (
                  <li
                    key={item}
                    className="relative py-3 pl-7 text-[14.5px] text-[#5C6E64] leading-relaxed border-b border-black/5 last:border-0 before:content-['→'] before:absolute before:left-0 before:top-[13px] before:text-[#0FA968] before:font-bold"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </section>

        {/* COMMERCIALS */}
        <section className="bg-[#0E1E16] text-[#EAF4EE] py-20 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <Eyebrow className="!text-[#3EE08F]">
              {t('ambassadors_commercial_eyebrow')}
            </Eyebrow>
            <h2 className="font-serif text-white text-3xl md:text-5xl mt-3 leading-[1.1] max-w-2xl">
              {t('ambassadors_commercial_title')}{' '}
              <em className="italic text-[#3EE08F]">
                {t('ambassadors_commercial_accent')}
              </em>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-11">
              {[
                {
                  value: `€${PLATFORM_SETUP_FEE_EUR}`,
                  label: t('ambassadors_commercial_setup'),
                },
                {
                  value: `€${PLATFORM_SUBSCRIPTION_PRICE_EUR}`,
                  label: t('ambassadors_commercial_monthly'),
                },
                {
                  value: t('ambassadors_commercial_trial_value'),
                  label: t('ambassadors_commercial_trial'),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-[#3EE08F]/30 rounded-[18px] px-6 py-7 bg-[#3EE08F]/[0.06]"
                >
                  <b className="font-serif text-4xl text-[#3EE08F] block leading-none">
                    {stat.value}
                  </b>
                  <span className="block text-[13px] text-[#BFD6C9] mt-3 leading-relaxed">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[14.5px] text-[#B9CFC2] max-w-2xl mt-8 leading-relaxed">
              {t('ambassadors_commercial_body')}
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Eyebrow>{t('ambassadors_faq_title')}</Eyebrow>
              <h2 className="font-serif text-3xl md:text-[44px] mt-3">
                {t('ambassadors_faq_headline')}{' '}
                <em className="italic text-[#0FA968]">
                  {t('ambassadors_faq_headline_accent')}
                </em>
              </h2>
            </div>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="border-b border-[#C2F0DA]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full text-left py-5 text-[16.5px] font-semibold flex justify-between items-center gap-4"
                  >
                    {faq.question}
                    <span
                      className={`text-[#0FA968] text-2xl font-normal transition-transform shrink-0 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen ? (
                    <p className="text-[#5C6E64] text-[15px] pb-5 leading-relaxed">
                      {faq.answer}
                    </p>
                  ) : null}
                </div>
              );
            })}

            <p className="text-[13.5px] text-[#5C6E64] mt-10 text-center">
              {t('ambassadors_profile_hint')}{' '}
              <Link
                href="/community"
                className="font-semibold text-[#0B7A4C] underline underline-offset-[3px]"
              >
                {t('ambassadors_members_link')}
              </Link>
            </p>
          </div>
        </section>

        {/* CLOSING CTA */}
        {!isAmbassador && !success && !isPendingReview ? (
          <section className="text-center py-24 px-6 bg-[radial-gradient(circle_560px_at_50%_130%,rgba(62,224,143,0.24),transparent)]">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-serif text-4xl md:text-6xl mb-5 leading-[1.08]">
                {t('ambassadors_closing_title')}{' '}
                <em className="italic text-[#0FA968]">
                  {t('ambassadors_closing_accent')}
                </em>
              </h2>
              <p className="text-[#5C6E64] mb-9 text-[15px]">
                {t('ambassadors_closing_body')}
              </p>
              <button
                type="button"
                onClick={startApplication}
                disabled={isApiLoading}
                className={btnPrimary}
              >
                {t('ambassadors_cta_join')}
              </button>
            </div>
          </section>
        ) : (
          <section className="text-center py-20 px-6">
            <Link href="/map" className={btnSmall}>
              {t('ambassadors_cta_map')} →
            </Link>
          </section>
        )}
      </div>
    </>
  );
};

export default AmbassadorLandingPage;
