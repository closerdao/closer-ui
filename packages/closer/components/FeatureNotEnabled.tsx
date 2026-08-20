import Head from 'next/head';
import Link from 'next/link';

import ErrorPage from './ErrorPage';

import { useTranslations } from 'next-intl';

type FeatureType =
  | 'booking'
  | 'events'
  | 'subscriptions'
  | 'volunteering'
  | 'learn'
  | 'blog'
  | 'community'
  | 'quests'
  | 'generic';

interface Props {
  feature?: FeatureType;
}

const FeatureNotEnabled = ({ feature = 'generic' }: Props) => {
  const t = useTranslations();

  const getFeatureMessage = () => {
    switch (feature) {
      case 'booking':
        return t('feature_not_enabled_booking');
      case 'events':
        return t('feature_not_enabled_events');
      case 'subscriptions':
        return t('feature_not_enabled_subscriptions');
      case 'volunteering':
        return t('feature_not_enabled_volunteering');
      case 'learn':
        return t('feature_not_enabled_learn');
      case 'blog':
        return t('feature_not_enabled_blog');
      case 'community':
        return t('feature_not_enabled_community');
      case 'quests':
        return t('feature_not_enabled_quests');
      default:
        return t('feature_not_enabled_description');
    }
  };

  return (
    <>
      <Head>
        <title>{t('feature_not_enabled_title')}</title>
      </Head>
      <ErrorPage
        code={
          <svg
            className="w-20 h-20 sm:w-24 sm:h-24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
            <path d="M8 10.5V7a4 4 0 1 1 8 0v3.5" />
          </svg>
        }
        title={t('feature_not_enabled_title')}
        message={getFeatureMessage()}
      >
        <Link href="/" className="btn-primary">
          {t('feature_not_enabled_go_home')}
        </Link>
      </ErrorPage>
    </>
  );
};

export default FeatureNotEnabled;
