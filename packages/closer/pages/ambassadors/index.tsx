import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useState } from 'react';

import AmbassadorBadge from '../../components/AmbassadorBadge';
import { Button, ErrorMessage, Heading, LinkButton } from '../../components/ui';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/landProject.constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { logMetric } from '../../utils/metrics';
import { reportIssue } from '../../utils/reporting.utils';

const AmbassadorLandingPage = () => {
  const t = useTranslations();
  const { user, refetchUser, isAuthenticated } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const router = useRouter();
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isAmbassador = Boolean(
    user?.affiliate || user?.roles?.includes(AMBASSADOR_ROLE),
  );

  const becomeAmbassador = async () => {
    if (!isAuthenticated) {
      router.push('/login?back=/ambassadors');
      return;
    }

    if (isAmbassador) {
      router.push('/settings/affiliate');
      return;
    }

    if (!user?._id || !platform?.user?.patch) {
      setError(t('ambassadors_error_system'));
      return;
    }

    try {
      setIsApiLoading(true);
      setError(null);

      const nextRoles = Array.from(
        new Set([...(user.roles || []), AMBASSADOR_ROLE]),
      );

      await platform.user.patch(user._id, {
        affiliate: new Date(),
        roles: nextRoles,
      });
      await refetchUser();

      void logMetric({
        event: 'ambassador-signup',
        category: 'affiliate',
        value: 'signup',
        number: 1,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/settings/affiliate');
      }, 1500);
    } catch (err) {
      console.error(err);
      reportIssue(
        `Error adding ambassador to user: ${user?._id}`,
        user?.email,
      );
      setError(t('ambassadors_error_signup'));
    } finally {
      setIsApiLoading(false);
    }
  };

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
      <div className="main-content w-full flex flex-col gap-8 py-8 max-w-3xl">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Heading level={1}>{t('ambassadors_page_title')}</Heading>
            {isAmbassador ? <AmbassadorBadge size="md" /> : null}
          </div>
          <p className="text-gray-700">{t('ambassadors_page_intro')}</p>
          <p className="text-gray-600">{t('ambassadors_page_body')}</p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
          <Heading level={3}>{t('ambassadors_rewards_title')}</Heading>
          <p className="text-sm text-gray-700">
            {t('ambassadors_rewards_body')}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4">
          <Heading level={3}>{t('ambassadors_responsibilities_title')}</Heading>
          <ul className="list-disc pl-5 text-sm text-gray-700 flex flex-col gap-1">
            <li>{t('ambassadors_responsibility_1')}</li>
            <li>{t('ambassadors_responsibility_2')}</li>
            <li>{t('ambassadors_responsibility_3')}</li>
          </ul>
        </div>

        {error ? <ErrorMessage error={error} /> : null}
        {success ? (
          <p className="text-sm text-accent-foreground">
            {t('ambassadors_signup_success')}
          </p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={becomeAmbassador}
            isLoading={isApiLoading}
            isEnabled={!isApiLoading}
          >
            {isAmbassador
              ? t('ambassadors_cta_dashboard')
              : t('ambassadors_cta_join')}
          </Button>
          <LinkButton href="/map" variant="secondary">
            {t('ambassadors_cta_map')}
          </LinkButton>
        </div>

        <div className="flex flex-col gap-3">
          <Heading level={3}>{t('ambassadors_faq_title')}</Heading>
          {faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-1">
              <p className="font-medium text-sm">{faq.question}</p>
              <p className="text-sm text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-600">
          {t('ambassadors_profile_hint')}{' '}
          <Link href="/members" className="underline">
            {t('ambassadors_members_link')}
          </Link>
        </p>
      </div>
    </>
  );
};

export default AmbassadorLandingPage;
