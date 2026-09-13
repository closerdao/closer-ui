import { CreditCard } from 'lucide-react';

import { useTranslations } from 'next-intl';

import {
  SettingsLayout,
  areSubscriptionsEnabled,
} from '../../components/Settings';
import SubscriptionSettings from '../../components/SubscriptionSettings';

import { useAuth } from '../../contexts/auth';
import PageNotFound from '../not-found';

const SubscriptionSettingsPage = () => {
  const t = useTranslations() as (key: string) => string;
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound
        back="/settings/subscription"
        error="Please log in to see this page."
      />
    );
  }

  if (!areSubscriptionsEnabled()) {
    return <PageNotFound error="" />;
  }

  return (
    <SettingsLayout
      activeTab="subscription"
      pageTitle={`${user.screenname} | ${t('settings_page_title')}`}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('subscriptions_settings_title')}
          </h3>
        </div>
        <SubscriptionSettings />
      </div>
    </SettingsLayout>
  );
};

export default SubscriptionSettingsPage;
