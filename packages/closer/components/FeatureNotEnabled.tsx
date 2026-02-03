import Head from 'next/head';
import Link from 'next/link';

import Heading from './ui/Heading';

import { useTranslations } from 'next-intl';

type FeatureType =
  | 'booking'
  | 'events'
  | 'subscriptions'
  | 'volunteering'
  | 'learn'
  | 'blog'
  | 'community'
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
      default:
        return t('feature_not_enabled_description');
    }
  };

  return (
    <>
      <Head>
        <title>{t('feature_not_enabled_title')}</title>
      </Head>
      <main className="main-content about intro page-not-found max-w-prose h-full flex flex-col flex-1 justify-center gap-4">
        <Heading>{t('feature_not_enabled_title')}</Heading>
        <Heading level={2} className="font-light italic my-4">
          {getFeatureMessage()}
        </Heading>
        <p>
          <Link href="/" className="btn text-center">
            {t('feature_not_enabled_go_home')}
          </Link>
        </p>
      </main>
    </>
  );
};

export default FeatureNotEnabled;
