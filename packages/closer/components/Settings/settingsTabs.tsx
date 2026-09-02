import React from 'react';

import {
  Bell,
  CreditCard,
  Key,
  Settings as SettingsIcon,
  Shield,
} from 'lucide-react';

import { useTranslations } from 'next-intl';

import { getCachedConfig } from '../../utils/cachedConfig.helpers';

export type SettingsTabId =
  | 'preferences'
  | 'account'
  | 'subscription'
  | 'notifications'
  | 'privacy';

export interface SettingsTab {
  id: SettingsTabId;
  href: string;
  label: string;
  icon: React.ReactNode;
}

export const areSubscriptionsEnabled = () =>
  Boolean(
    (getCachedConfig('subscriptions') as { enabled?: boolean } | null)
      ?.enabled && process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true',
  );

export const useSettingsTabs = (): SettingsTab[] => {
  const t = useTranslations() as (key: string) => string;

  return [
    {
      id: 'preferences',
      href: '/settings/preferences',
      label: t('settings_tab_preferences'),
      icon: <SettingsIcon className="w-4 h-4" />,
    },
    {
      id: 'account',
      href: '/settings/account',
      label: t('settings_tab_account'),
      icon: <Key className="w-4 h-4" />,
    },
    ...(areSubscriptionsEnabled()
      ? [
          {
            id: 'subscription' as SettingsTabId,
            href: '/settings/subscription',
            label: t('settings_tab_subscription'),
            icon: <CreditCard className="w-4 h-4" />,
          },
        ]
      : []),
    {
      id: 'notifications',
      href: '/settings/notifications',
      label: t('settings_tab_notifications'),
      icon: <Bell className="w-4 h-4" />,
    },
    {
      id: 'privacy',
      href: '/settings/privacy',
      label: t('settings_tab_privacy'),
      icon: <Shield className="w-4 h-4" />,
    },
  ];
};
