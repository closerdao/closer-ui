import Link from 'next/link';

import { Shield } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { SettingsLayout } from '../../components/Settings';
import Checkbox from '../../components/ui/Checkbox';

import { useSettingsUser } from '../../hooks/useSettingsUser';
import { isNearbyMembersEnabled } from '../../utils/nearbyMembers.helpers';
import PageNotFound from '../not-found';

const PrivacySettingsPage = () => {
  const t = useTranslations() as (key: string) => string;
  const { user, isAuthenticated, error, saveNearbyMembersEnabled } =
    useSettingsUser();

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound
        back="/settings/privacy"
        error="Please log in to see this page."
      />
    );
  }

  return (
    <SettingsLayout
      activeTab="privacy"
      pageTitle={`${user.screenname} | ${t('settings_page_title')}`}
      error={error}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_privacy_nearby_title')}
          </h3>
        </div>

        <div className="flex flex-col gap-2 p-3 hover:bg-gray-50 rounded-md">
          <div className="flex items-center justify-start gap-2">
            <Checkbox
              isChecked={isNearbyMembersEnabled(user)}
              onChange={saveNearbyMembersEnabled}
            />
            <label className="cursor-pointer flex-1">
              {t('settings_privacy_nearby_label')}
            </label>
          </div>
          <p className="text-sm text-gray-500 pl-7">
            {t('settings_privacy_nearby_help')}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/privacy-policy"
            className="text-sm text-accent font-semibold hover:underline"
          >
            {t('settings_privacy_policy_link')}
          </Link>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default PrivacySettingsPage;
