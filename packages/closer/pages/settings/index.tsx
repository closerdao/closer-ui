import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect, useRef, useState } from 'react';

import UploadPhoto from '../../components/UploadPhoto';
import { Button } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';
import MultiSelect from '../../components/ui/Select/MultiSelect';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import process from 'process';

import { SHARED_ACCOMMODATION_PREFERENCES } from '../../constants/shared.constants';
import { useAuth } from '../../contexts/auth';
import { type User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { VolunteerConfig } from '../../types';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

type UpdateUserFunction = (value: string | string[]) => Promise<void>;

// Tab interface types
type TabId = 'profile' | 'account' | 'preferences' | 'notifications' | 'danger';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// Navigation sidebar component
const SettingsSidebar = ({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabs: Tab[];
}) => {
  return (
    <div className="hidden md:block w-48 shrink-0">
      <div className="sticky top-4">
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Mobile tab selector component
const MobileTabSelector = ({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabs: Tab[];
}) => {
  return (
    <div className="md:hidden mb-6">
      <select
        value={activeTab}
        onChange={(e) => setActiveTab(e.target.value as TabId)}
        className="w-full p-2 border border-gray-300 rounded-md"
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.icon} {tab.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Delete Account Section Component
interface DeleteAccountSectionProps {
  t: any;
}
const DeleteAccountSection = ({ t }: DeleteAccountSectionProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'delete') {
      setError('Please type "delete" to confirm account deletion');
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete('/account');

      // Remove all cookies
      document.cookie.split(';').forEach((cookie) => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      // Log out user by clearing localStorage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home page after successful deletion
      window.location.href = '/';
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
      setIsDeleting(false);
    }
  };

  return (
    <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {!showConfirmation ? (
        <div>
          <p className="mb-4 text-gray-600">
            {t('settings_delete_account_warning')}
          </p>
          <Button
            onClick={() => setShowConfirmation(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('settings_delete_account_button')}
          </Button>
        </div>
      ) : (
        <div className="border border-red-300 rounded-md p-4 bg-red-50">
          <h4 className="font-bold text-red-700 mb-2">
            {t('settings_delete_account')}
          </h4>
          <p className="mb-4 text-red-700">
            {t('settings_delete_account_action_warning')}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-red-700">
              {t('settings_delete_account_type_to_confirm')}
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDeleteAccount}
              isEnabled={!isDeleting}
              className="bg-red-600 border-red-700 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? t('settings_deleting')
                : t('settings_delete_account_confirm_button')}
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText('');
                setError(null);
              }}
              variant="secondary"
            >
              {t('settings_cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = ({
  volunteerConfig,
}: {
  volunteerConfig: VolunteerConfig;
}) => {
  const t = useTranslations() as (key: string) => string;
  const { APP_NAME } = useConfig();
  const router = useRouter();

  const skillsOptions = volunteerConfig?.skills?.split(',') || [];
  const dietOptions = volunteerConfig?.diet?.split(',') || [];

  const { user: initialUser, isAuthenticated, refetchUser } = useAuth();

  const initialDiet = Array.isArray(initialUser?.preferences?.diet)
    ? initialUser?.preferences?.diet
    : initialUser?.preferences?.diet?.split(',') || [];

  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [updatePhone, toggleUpdatePhone] = useState<boolean | null>(null);
  const [updateEmail, toggleUpdateEmail] = useState<boolean | null>(null);
  const [phoneSaved, setPhoneSaved] = useState<boolean | null>(null);
  const [emailSaving, setEmailSaving] = useState<boolean | null>(null);
  const [phoneSaving, setPhoneSaving] = useState<boolean | null>(null);
  const [emailSaved, setEmailSaved] = useState<boolean | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false); // For non-auto-saving inputs
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const { platform } = usePlatform() as any;

  const kycDataDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Define tabs
  const tabs: Tab[] = [
    { id: 'profile', label: t('settings_tab_profile'), icon: '👤' },
    { id: 'account', label: t('settings_tab_account'), icon: '🔑' },
    { id: 'preferences', label: t('settings_tab_preferences'), icon: '⭐' },
    { id: 'notifications', label: t('settings_tab_notifications'), icon: '🔔' },
    { id: 'danger', label: t('settings_tab_danger'), icon: '⚠️' },
  ];

  // Scroll to top when changing tabs
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    if (initialUser) {
      console.log('[SettingsPage] initialUser kycData:', initialUser.kycData);
      setUser(initialUser);

      if (!initialUser.kycData && initialUser._id) {
        api
          .get('/mine/user')
          .then((response) => {
            const fullUser = response?.data?.results as User | undefined;
            console.log('[SettingsPage] fetched fullUser:', fullUser);
            console.log(
              '[SettingsPage] fetched fullUser.kycData:',
              fullUser?.kycData,
            );
            if (fullUser) {
              setUser(fullUser);
            }
          })
          .catch((err) => {
            console.error(
              '[SettingsPage] Error fetching user with kycData:',
              err,
            );
          });
      }
    }
  }, [initialUser]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(kycDataDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  // Handle tab change from URL hash
  useEffect(() => {
    const hash = router.asPath.split('#')[1] as TabId;
    if (hash && tabs.some((tab) => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, [router.asPath]);

  const saveUserData =
    (
      attribute:
        | keyof User['preferences']
        | keyof User
        | keyof User['settings']
        | keyof User['kycData'],
    ): UpdateUserFunction =>
    async (value: string | string[] | React.ChangeEvent<HTMLInputElement>) => {
      let actualValue: string | string[];

      if (typeof value === 'object' && 'target' in value) {
        actualValue = (value as React.ChangeEvent<HTMLInputElement>).target
          .value;
      } else {
        actualValue = value as string | string[];
      }

      console.log('[saveUserData] received value:', value);
      console.log('[saveUserData] actualValue:', actualValue);

      const prefKeys = [
        'diet',
        'sharedAccomodation',
        'superpower',
        'skills',
        'dream',
        'needs',
        'moreInfo',
      ];
      const kycDataKeys = ['legalName', 'address1', 'taxId'];
      let payload: Partial<User> = {
        [attribute]: actualValue,
      };
      if (prefKeys.includes(attribute)) {
        payload = {
          preferences: {
            ...user?.preferences,
            [attribute]: actualValue,
          },
        };
      } else if (kycDataKeys.includes(attribute)) {
        const stringValue =
          typeof actualValue === 'string'
            ? actualValue
            : Array.isArray(actualValue)
            ? actualValue.join(',')
            : '';

        if (kycDataDebounceTimers.current[attribute]) {
          clearTimeout(kycDataDebounceTimers.current[attribute]);
        }

        kycDataDebounceTimers.current[attribute] = setTimeout(async () => {
          try {
            const currentUserResponse = await api.get('/mine/user');
            const currentUser = currentUserResponse?.data?.results as
              | User
              | undefined;
            const existingKycData =
              currentUser?.kycData || user?.kycData || initialUser?.kycData;

            const debouncedPayload = {
              kycData: {
                IP: existingKycData?.IP || '',
                dateRecorded: existingKycData?.dateRecorded || new Date(),
                legalName: existingKycData?.legalName || '',
                TIN: existingKycData?.TIN || '',
                address1: existingKycData?.address1 || '',
                postalCode: existingKycData?.postalCode || '',
                city: existingKycData?.city || '',
                state: existingKycData?.state || '',
                country: existingKycData?.country || '',
                taxId: existingKycData?.taxId || '',
                [attribute]: stringValue,
              } as User['kycData'],
            };

            setHasSaved(false);
            console.log('[saveUserData] debounced payload:', debouncedPayload);
            const result = await platform.user.patch(
              user?._id,
              debouncedPayload,
            );
            await refetchUser();
            const updatedUserResponse = await api.get('/mine/user');
            const updatedUser = updatedUserResponse?.data?.results as
              | User
              | undefined;
            if (updatedUser) {
              console.log(
                '[saveUserData] updatedUser kycData:',
                updatedUser.kycData,
              );
              setUser(updatedUser);
            }
            setError(null);
            setHasSaved(true);
          } catch (err) {
            const errorMessage = parseMessageFromError(err);
            setError(errorMessage);
            console.error('[saveUserData] error:', errorMessage, err);
          }
        }, 500);

        return;
      }

      try {
        setHasSaved(false);
        console.log('[saveUserData] payload:', payload);
        const result = await platform.user.patch(user?._id, payload);
        await refetchUser();
        const updatedUserResponse = await api.get('/mine/user');
        const updatedUser = updatedUserResponse?.data?.results as
          | User
          | undefined;
        if (updatedUser) {
          console.log(
            '[saveUserData] updatedUser kycData:',
            updatedUser.kycData,
          );
          setUser(updatedUser);
        }
        setError(null);
        setHasSaved(true);
        // Don't show global success message for auto-saving inputs
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
        console.error('[saveUserData] error:', errorMessage, err);
      }
    };
  const saveSettings = (field: string) => async (event: any) => {
    const value = !!event.target.checked;
    try {
      setHasSaved(false);
      await platform.user.patch(user?._id, { settings: { [field]: value } });
      await refetchUser();
      setError(null);
      setHasSaved(true);
      setShowSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    }
  };
  const savePhone = async (phone: string) => {
    setPhoneSaving(true);
    try {
      setPhoneSaved(false);
      await api.post('/auth/phone/update', { phone });
      setError(null);
      setPhoneSaved(true);
      setShowSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    } finally {
      setPhoneSaving(false);
    }
  };
  const saveEmail = async (email: string) => {
    setEmailSaving(true);
    try {
      setEmailSaved(false);
      await api.post('/auth/email/update', { email });
      setError(null);
      setEmailSaved(true);
      setShowSaveSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    } finally {
      setEmailSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound back="/settings" error="Please log in to see this page." />
    );
  }

  return (
    <>
      <Head>
        <title>{user.screenname} | Settings</title>
      </Head>
      <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-6">
        <Heading className="mb-6">⚙️ Settings</Heading>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar navigation */}
          <SettingsSidebar
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              router.push(`/settings#${tab}`, undefined, { shallow: true });
            }}
            tabs={tabs}
          />

          {/* Mobile tab selector */}
          <MobileTabSelector
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              router.push(`/settings#${tab}`, undefined, { shallow: true });
            }}
            tabs={tabs}
          />

          {/* Main content area */}
          <div ref={contentRef} className="flex-1 overflow-hidden">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    👤 {t('settings_profile_information')}
                  </h3>

                  <Input
                    label={t('settings_about_you')}
                    additionalInfo={
                      APP_NAME === 'moos'
                        ? t('settings_required_to_make_bookings')
                        : ''
                    }
                    isRequired={APP_NAME === 'moos' ? true : false}
                    placeholder={t('settings_tell_us_more_about_yourself')}
                    value={user.about}
                    onChange={saveUserData('about') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <div className="mt-6">
                    <label
                      className="font-medium text-complimentary-light"
                      htmlFor=""
                    >
                      {t('settings_profile_picture')}
                      {APP_NAME === 'moos' && (
                        <span className="text-red-500">
                          {t('settings_required_to_make_bookings_star')}
                        </span>
                      )}
                    </label>
                    <UploadPhoto
                      model="user"
                      id={user._id}
                      label={t('settings_change')}
                      className="my-4"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    🔑 Account Information
                  </h3>

                  <Input
                    label={t('settings_name')}
                    placeholder={t('settings_your_name')}
                    value={user.screenname}
                    onChange={saveUserData('screenname') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <div className="mb-6">
                    <Input
                      label={t('settings_email')}
                      value={user.email}
                      isDisabled={!updateEmail}
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      successMessage={
                        emailSaved
                          ? t('settings_email_confirm_message')
                          : undefined
                      }
                      validation="email"
                      className="mb-2"
                    />
                    <div>
                      {updateEmail && !emailSaved ? (
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => saveEmail(user.email)}
                            isEnabled={!emailSaving}
                            variant="inline"
                          >
                            {emailSaving
                              ? t('settings_verifying')
                              : t('settings_verify_email')}
                          </Button>
                          <Button
                            onClick={() => {
                              setUser({
                                ...user,
                                email: initialUser?.email || user.email,
                              });
                              toggleUpdateEmail(false);
                            }}
                            variant="inline"
                          >
                            {t('settings_cancel')}
                          </Button>
                        </div>
                      ) : (
                        !emailSaved && (
                          <Button
                            onClick={() => toggleUpdateEmail(!updateEmail)}
                            variant="inline"
                            className="mt-2"
                          >
                            {t('settings_edit_email')}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <Input
                      label={t('settings_phone')}
                      isDisabled={!updatePhone}
                      value={user.phone}
                      onChange={(e) =>
                        setUser({ ...user, phone: e.target.value })
                      }
                      successMessage={
                        phoneSaved
                          ? t('settings_phone_confirm_message')
                          : undefined
                      }
                      validation="phone"
                      className="mb-2"
                    />
                    <div>
                      {updatePhone && !phoneSaved ? (
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => savePhone(user.phone)}
                            isEnabled={!phoneSaving}
                            variant="inline"
                          >
                            {phoneSaving
                              ? t('settings_verifying')
                              : t('settings_verify_phone')}
                          </Button>
                          <Button
                            onClick={() => {
                              setUser({
                                ...user,
                                phone: initialUser?.phone || user.phone,
                              });
                              toggleUpdatePhone(false);
                            }}
                            variant="inline"
                          >
                            {t('settings_cancel')}
                          </Button>
                        </div>
                      ) : (
                        !phoneSaved && (
                          <Button
                            onClick={() => toggleUpdatePhone(!updatePhone)}
                            variant="inline"
                            className="mt-2"
                          >
                            {t('settings_edit_phone')}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    💳 {t('settings_billing_information')}
                  </h3>

                  <Input
                    label={t('settings_legal_name')}
                    placeholder={t('settings_legal_name_placeholder')}
                    value={user?.kycData?.legalName || ''}
                    onChange={saveUserData('legalName') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_billing_address')}
                    placeholder={t('settings_billing_address_placeholder')}
                    value={user?.kycData?.address1 || ''}
                    onChange={saveUserData('address1') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_tax_number')}
                    placeholder={t('settings_tax_number_placeholder')}
                    value={user?.kycData?.taxId || ''}
                    onChange={saveUserData('taxId') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                  />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    ⭐ Recommended Preferences
                  </h3>

                  <MultiSelect
                    label={t('settings_dietary_preferences')}
                    values={initialDiet}
                    onChange={saveUserData('diet')}
                    options={dietOptions}
                    placeholder={t('settings_pick_or_create_yours')}
                    className="mb-4"
                  />

                  {APP_NAME && APP_NAME?.toLowerCase() !== 'moos' && (
                    <Select
                      label={t('settings_shared_accommodation_preference')}
                      value={user?.preferences?.sharedAccomodation}
                      options={SHARED_ACCOMMODATION_PREFERENCES}
                      className="mb-4"
                      onChange={saveUserData('sharedAccomodation')}
                      isRequired
                    />
                  )}

                  <Input
                    label={t('settings_superpower')}
                    placeholder={t('settings_superpower_placeholder')}
                    value={user?.preferences?.superpower}
                    onChange={saveUserData('superpower') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <MultiSelect
                    label={t('settings_skills')}
                    values={user?.preferences?.skills}
                    onChange={saveUserData('skills')}
                    options={skillsOptions}
                    placeholder={t('settings_pick_or_create_yours')}
                    className="mb-4"
                  />
                </div>

                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    🔰 Optional Information
                  </h3>

                  <Input
                    label={t('settings_dream')}
                    placeholder={t('settings_dream_placeholder')}
                    value={user?.preferences?.dream}
                    onChange={saveUserData('dream') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_needs')}
                    placeholder=""
                    value={user?.preferences?.needs}
                    onChange={saveUserData('needs') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_more_info')}
                    placeholder=""
                    value={user?.preferences?.moreInfo}
                    onChange={saveUserData('moreInfo') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                  />
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">
                    🔔 Notification Preferences
                  </h3>

                  <div className="flex items-center justify-start gap-2 p-3 hover:bg-gray-50 rounded-md">
                    <Checkbox
                      isChecked={user?.settings?.newsletter_weekly}
                      onChange={saveSettings('newsletter_weekly')}
                    />
                    <label className="cursor-pointer flex-1">
                      {t('settings_weekly_newsletter')}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4 text-red-600">
                    ⚠️
                    {t('settings_danger_zone')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('settings_danger_zone_warning')}
                  </p>

                  <DeleteAccountSection t={t} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

SettingsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [volunteerConfigRes, messages] = await Promise.all([
      api.get('/config/volunteering').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const volunteerConfig = volunteerConfigRes?.data?.results.value;

    return {
      volunteerConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
      volunteerConfig: null,
    };
  }
};

export default SettingsPage;
