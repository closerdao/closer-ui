import Head from 'next/head';
import Link from 'next/link';

import React from 'react';

import { useTranslations } from 'next-intl';

import Heading from '../ui/Heading';
import { SettingsTab, SettingsTabId, useSettingsTabs } from './settingsTabs';

// Navigation sidebar component
const SettingsSidebar = ({
  activeTab,
  tabs,
}: {
  activeTab: SettingsTabId;
  tabs: SettingsTab[];
}) => {
  return (
    <div className="hidden md:block w-48 shrink-0">
      <nav className="sticky top-4">
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const MobileTabSelector = ({
  activeTab,
  tabs,
}: {
  activeTab: SettingsTabId;
  tabs: SettingsTab[];
}) => {
  return (
    <nav
      className="md:hidden -mx-4 px-4 mb-3 overflow-x-auto"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex gap-1 min-w-max pb-1">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}
          >
            <span className="w-4 h-4 shrink-0">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

interface SettingsLayoutProps {
  activeTab: SettingsTabId;
  /** Shown in the browser tab, prefixed with the member's screenname. */
  pageTitle?: string;
  error?: string | null;
  children: React.ReactNode;
}

/**
 * Chrome shared by every /settings/* route: the heading, the section nav and
 * the error banner. Each route owns the content of its own panel.
 */
const SettingsLayout = ({
  activeTab,
  pageTitle,
  error,
  children,
}: SettingsLayoutProps) => {
  const t = useTranslations() as (key: string) => string;
  const tabs = useSettingsTabs();

  return (
    <>
      <Head>
        <title>{pageTitle || t('settings_page_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-3 md:py-6">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Heading>{t('settings_page_title')}</Heading>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <SettingsSidebar activeTab={activeTab} tabs={tabs} />
          <MobileTabSelector activeTab={activeTab} tabs={tabs} />

          <div className="flex-1 overflow-hidden">
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsLayout;
