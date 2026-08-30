import { Bell } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { SettingsLayout } from '../../components/Settings';
import Checkbox from '../../components/ui/Checkbox';

import { usePushNotifications } from '../../contexts/push-notifications';
import { useSettingsUser } from '../../hooks/useSettingsUser';
import PageNotFound from '../not-found';

const NotificationsSettingsPage = () => {
  const t = useTranslations() as (key: string) => string;
  const { user, isAuthenticated, error, saveSettings } = useSettingsUser();
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotifications();

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound
        back="/settings/notifications"
        error="Please log in to see this page."
      />
    );
  }

  return (
    <SettingsLayout
      activeTab="notifications"
      pageTitle={`${user.screenname} | ${t('settings_page_title')}`}
      error={error}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_notification_preferences')}
          </h3>
        </div>

        <div className="flex items-center justify-start gap-2 p-3 hover:bg-gray-50 rounded-md">
          <Checkbox
            isChecked={user?.settings?.newsletter_weekly}
            onChange={saveSettings('newsletter_weekly')}
          />
          <label className="cursor-pointer flex-1">
            {t('settings_weekly_newsletter')}
          </label>
        </div>

        {isPushSupported && (
          <div className="flex items-center justify-start gap-2 p-3 hover:bg-gray-50 rounded-md">
            {pushPermission === 'denied' ? (
              <div className="text-sm text-gray-500">
                {t('push_notification_settings_denied')}
              </div>
            ) : (
              <>
                <Checkbox
                  isChecked={isPushSubscribed}
                  onChange={async () => {
                    if (isPushSubscribed) {
                      await pushUnsubscribe();
                    } else {
                      await pushSubscribe();
                    }
                  }}
                />
                <label className="cursor-pointer flex-1">
                  {t('push_notification_settings_label')}
                </label>
              </>
            )}
          </div>
        )}

        {!isPushSupported && (
          <div className="p-3 text-sm text-gray-500">
            {t('push_notification_settings_unsupported')}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
};

export default NotificationsSettingsPage;
