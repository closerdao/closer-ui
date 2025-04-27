import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';

import UploadPhoto from '../../components/UploadPhoto';
import { Button } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';
import MultiSelect from '../../components/ui/Select/MultiSelect';

import { NextPageContext } from 'next';
import process from 'process';

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
const SettingsSidebar = ({ activeTab, setActiveTab, tabs }: {
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
const MobileTabSelector = ({ activeTab, setActiveTab, tabs }: {
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
const DeleteAccountSection = () => {
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
      document.cookie.split(';').forEach(cookie => {
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
            Deleting your account will permanently remove all your data from our systems.
            This action cannot be undone.
          </p>
          <Button
            onClick={() => setShowConfirmation(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Account
          </Button>
        </div>
      ) : (
        <div className="border border-red-300 rounded-md p-4 bg-red-50">
          <h4 className="font-bold text-red-700 mb-2">Delete Account</h4>
          <p className="mb-4 text-red-700">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-red-700">
              Type &quot;delete&quot; to confirm
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
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText('');
                setError(null);
              }}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const SHARED_ACCOMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

const SettingsPage = ({
  volunteerConfig,
}: {
  volunteerConfig: VolunteerConfig;
}) => {
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
  
  // Define tabs
  const tabs: Tab[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'account', label: 'Account', icon: '🔑' },
    { id: 'preferences', label: 'Preferences', icon: '⭐' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
  ];

  // Scroll to top when changing tabs
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);
  
  // Handle tab change from URL hash
  useEffect(() => {
    const hash = router.asPath.split('#')[1] as TabId;
    if (hash && tabs.some(tab => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, [router.asPath]);

  const saveUserData =
    (
      attribute:
        | keyof User['preferences']
        | keyof User
        | keyof User['settings'],
    ): UpdateUserFunction =>
    async (value: string | string[]) => {
      const prefKeys = [
        'diet',
        'sharedAccomodation',
        'superpower',
        'skills',
        'dream',
        'needs',
        'moreInfo',
      ];
      let payload: Partial<User> = {
        [attribute]: value,
      };
      if (prefKeys.includes(attribute)) {
        payload = {
          preferences: {
            ...user?.preferences,
            [attribute]: value,
          },
        };
      }
      try {
        setHasSaved(false);
        await platform.user.patch(user?._id, payload);
        await refetchUser();
        setError(null);
        setHasSaved(true);
        // Don't show global success message for auto-saving inputs
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
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
        
        {showSaveSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6 animate-fade-out">
            <span className="block sm:inline">Changes saved successfully!</span>
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
                  <h3 className="text-lg font-medium mb-4">👤 Profile Information</h3>
                  
                  <Input
                    label="About me"
                    additionalInfo={
                      APP_NAME === 'moos' ? 'Required to make bookings' : ''
                    }
                    isRequired={APP_NAME === 'moos' ? true : false}
                    placeholder="Tell us more about yourself"
                    value={user.about}
                    onChange={saveUserData('about') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />
                  
                  <div className="mt-6">
                    <label className="font-medium text-complimentary-light" htmlFor="">
                      Profile Picture{' '}
                      {APP_NAME === 'moos' && (
                        <span className="text-red-500">[Required to make bookings]*</span>
                      )}
                    </label>
                    <UploadPhoto
                      model="user"
                      id={user._id}
                      label={user.photo ? 'Change' : 'Add photo'}
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
                  <h3 className="text-lg font-medium mb-4">🔑 Account Information</h3>
                  
                  <Input
                    label="Name"
                    placeholder="Your name"
                    value={user.screenname}
                    onChange={saveUserData('screenname') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />
                  
                  <div className="mb-6">
                    <Input
                      label="Email"
                      value={user.email}
                      isDisabled={!updateEmail}
                      onChange={(e) => setUser({ ...user, email: e.target.value })}
                      successMessage={
                        emailSaved
                          ? 'You will receive a link to confirm via email.'
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
                            {emailSaving ? 'Verifying...' : 'Verify Email'}
                          </Button>
                          <Button
                            onClick={() => {
                              setUser({ ...user, email: initialUser?.email || user.email });
                              toggleUpdateEmail(false);
                            }}
                            variant="inline"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        !emailSaved && (
                          <Button
                            onClick={() => toggleUpdateEmail(!updateEmail)}
                            variant="inline"
                            className="mt-2"
                          >
                            Edit Email
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Input
                      label="Phone"
                      isDisabled={!updatePhone}
                      value={user.phone}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      successMessage={
                        phoneSaved
                          ? 'You will receive a link to confirm via text.'
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
                            {phoneSaving ? 'Verifying...' : 'Verify Phone'}
                          </Button>
                          <Button
                            onClick={() => {
                              setUser({ ...user, phone: initialUser?.phone || user.phone });
                              toggleUpdatePhone(false);
                            }}
                            variant="inline"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        !phoneSaved && (
                          <Button
                            onClick={() => toggleUpdatePhone(!updatePhone)}
                            variant="inline"
                            className="mt-2"
                          >
                            Edit Phone
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">⭐ Recommended Preferences</h3>
                  
                  <MultiSelect
                    label="Dietary Preferences?"
                    values={initialDiet}
                    onChange={saveUserData('diet')}
                    options={dietOptions}
                    placeholder="Pick or create yours"
                    className="mb-4"
                  />
                  
                  {APP_NAME && APP_NAME.toLowerCase() !== 'moos' && (
                    <Select
                      label="Shared Accommodation Preference"
                      value={user?.preferences?.sharedAccomodation}
                      options={SHARED_ACCOMODATION_PREFERENCES}
                      className="mb-4"
                      onChange={saveUserData('sharedAccomodation')}
                      isRequired
                    />
                  )}
                  
                  <Input
                    label="What is your superpower?"
                    placeholder="I am really good at ..."
                    value={user?.preferences?.superpower}
                    onChange={saveUserData('superpower') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />
                  
                  <MultiSelect
                    label="What skills do you have?"
                    values={user?.preferences?.skills}
                    onChange={saveUserData('skills')}
                    options={skillsOptions}
                    placeholder="Pick or create yours"
                    className="mb-4"
                  />
                </div>
                
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4">🔰 Optional Information</h3>
                  
                  <Input
                    label="What do you dream of creating?"
                    placeholder="I dream of creating ..."
                    value={user?.preferences?.dream}
                    onChange={saveUserData('dream') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />
                  
                  <Input
                    label="What is one thing you currently need support with?"
                    placeholder=""
                    value={user?.preferences?.needs}
                    onChange={saveUserData('needs') as any}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />
                  
                  <Input
                    label="Anything we should know? Anything you would like to share?"
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
                  <h3 className="text-lg font-medium mb-4">🔔 Notification Preferences</h3>
                  
                  <div className="flex items-center justify-start gap-2 p-3 hover:bg-gray-50 rounded-md">
                    <Checkbox
                      isChecked={user?.settings?.newsletter_weekly}
                      onChange={saveSettings('newsletter_weekly')}
                    />
                    <label className="cursor-pointer flex-1">Weekly newsletter</label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-medium mb-4 text-red-600">⚠️ Danger Zone</h3>
                  <p className="text-gray-600 mb-6">
                    Actions in this section can result in permanent data loss. Please proceed with caution.
                  </p>
                  
                  <DeleteAccountSection />
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
