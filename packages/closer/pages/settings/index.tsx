import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect, useRef, useState } from 'react';

import { Key, Star, Bell, AlertTriangle, BadgeCheck, Settings as SettingsIcon, CreditCard, Info } from 'lucide-react';

import SubscriptionSettings from '../../components/SubscriptionSettings';
import { Button } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';
import MultiSelect from '../../components/ui/Select/MultiSelect';

import { useTranslations } from 'next-intl';

import { SHARED_ACCOMMODATION_PREFERENCES } from '../../constants/shared.constants';
import { useAuth } from '../../contexts/auth';
import { type User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { usePushNotifications } from '../../contexts/push-notifications';
import { useConfig } from '../../hooks/useConfig';
import { VolunteerConfig } from '../../types';
import api from '../../utils/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../utils/common';
import { getDietOptions, toSingleDiet } from '../../utils/dietOptions';
import PageNotFound from '../not-found';

type UpdateUserFunction = (
  value: string | string[] | React.ChangeEvent<HTMLInputElement>,
) => Promise<void>;

/*
 * Every field on this page saves itself, but it used to save on every
 * keystroke: the input rendered straight off the fetched user, so each
 * character fired a PATCH and the response then overwrote whatever had been
 * typed in the meantime. Edits now land in a local draft that the inputs read
 * from, and the draft is flushed on a fixed interval (and on blur, tab change
 * and unmount) instead of on every change.
 */
const AUTOSAVE_INTERVAL_MS = 5000;

const PREFERENCE_FIELDS = [
  'diet',
  'sharedAccomodation',
  'superpower',
  'skills',
  'dream',
  'needs',
  'moreInfo',
];

const KYC_FIELDS = [
  'legalName',
  'address1',
  'TIN',
  'country',
  'city',
  'postalCode',
];

type DraftValue = string | string[];

const asUser = (results: unknown): User | undefined =>
  results && !Array.isArray(results) && (results as User)._id
    ? (results as User)
    : undefined;

const isSameDraftValue = (a: DraftValue | undefined, b: DraftValue) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => item === b[i]);
  }
  return a === b;
};

// Tab interface types
type TabId = 'preferences' | 'account' | 'subscription' | 'notifications';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
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
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

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
    <div className="md:hidden -mx-4 px-4 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-1 min-w-max pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200'
            }`}
          >
            <span className="w-4 h-4 shrink-0">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/** Shown beside a contact field the backend has confirmed. */
const VerifiedBadge = ({ label }: { label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 border border-green-200">
    <BadgeCheck className="w-3 h-3" />
    {label}
  </span>
);

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

  // The caller supplies the card around this — it is a section of the Account
  // tab rather than a page of its own.
  return (
    <div>
      {!showConfirmation ? (
        <div>
          <p className="mb-4 text-gray-600">
            {t('settings_delete_account_warning')}
          </p>
          <Button
            onClick={() => setShowConfirmation(true)}
            variant="secondary"
            size="small"
            isFullWidth={false}
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

          <div className="flex items-center gap-4">
            <Button
              onClick={handleDeleteAccount}
              isEnabled={!isDeleting}
              size="small"
              isFullWidth={false}
              className="bg-red-600 border-red-700 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? t('settings_deleting')
                : t('settings_delete_account_confirm_button')}
            </Button>
            <button
              onClick={() => {
                setShowConfirmation(false);
                setConfirmText('');
                setError(null);
              }}
              className="text-sm underline text-red-700"
            >
              {t('settings_cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsPage = () => {
  const volunteerConfig = getCachedConfig('volunteering') as VolunteerConfig | null;
  const t = useTranslations() as (key: string) => string;
  const { APP_NAME } = useConfig();
  const router = useRouter();

  const skillsOptions = volunteerConfig?.skills?.split(',') || [];
  const dietOptions = getDietOptions();

  const { user: initialUser, isAuthenticated, refetchUser } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [updatePhone, toggleUpdatePhone] = useState<boolean | null>(null);
  const [updateEmail, toggleUpdateEmail] = useState<boolean | null>(null);
  /*
   * Email and phone are verified rather than autosaved, so the edit in progress
   * lives here. Writing it into `user` meant the next refresh of the auth user
   * overwrote it, and "verify" then posted the field it had just lost — an
   * empty body.
   */
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneSaved, setPhoneSaved] = useState<boolean | null>(null);
  const [emailSaving, setEmailSaving] = useState<boolean | null>(null);
  const [phoneSaving, setPhoneSaving] = useState<boolean | null>(null);
  const [emailSaved, setEmailSaved] = useState<boolean | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [, setShowSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('preferences');
  const { platform } = usePlatform() as any;
  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotifications();
  const [countries, setCountries] = useState<
    Array<{ label: string; value: string }>
  >([]);

  // Pending edits, keyed by field name. A field is read from here while it has
  // an entry, and from `user` once the entry has been saved and cleared.
  // The ref is the source of truth and the state is what renders: a keystroke
  // has to be visible to the next flush immediately, and a state updater does
  // not run until React gets round to re-rendering.
  const [draft, setDraft] = useState<Record<string, DraftValue>>({});
  const draftRef = useRef(draft);
  const writeDraft = (next: Record<string, DraftValue>) => {
    draftRef.current = next;
    setDraft(next);
  };
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const areSubscriptionsEnabled = Boolean(
    (getCachedConfig('subscriptions') as { enabled?: boolean } | null)
      ?.enabled && process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true',
  );

  // Define tabs
  const tabs: Tab[] = [
    { id: 'preferences', label: t('settings_tab_preferences'), icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'account', label: t('settings_tab_account'), icon: <Key className="w-4 h-4" /> },
    ...(areSubscriptionsEnabled
      ? [
          {
            id: 'subscription' as TabId,
            label: t('settings_tab_subscription'),
            icon: <CreditCard className="w-4 h-4" />,
          },
        ]
      : []),
    { id: 'notifications', label: t('settings_tab_notifications'), icon: <Bell className="w-4 h-4" /> },
  ];

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  useEffect(() => {
    if (initialUser) {
      setUser((current) =>
        current && current._id === initialUser._id
          ? {
              ...current,
              ...initialUser,
              kycData: initialUser.kycData || current.kycData,
            }
          : initialUser,
      );

      if (!initialUser.kycData && initialUser._id) {
        api
          .get('/mine/user')
          .then((response) => {
            const fullUser = asUser(response?.data?.results);
            if (fullUser) {
              setUser(fullUser);
            }
          })
          .catch(() => {});
      }
    }
  }, [initialUser]);

  // Anything still pending has to go out before the page stops existing:
  // leaving, or backgrounding the tab, should not lose the last few seconds of
  // typing.
  useEffect(() => {
    const flushPending = () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      void flushRef.current();
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushPending();
    };

    router.events.on('routeChangeStart', flushPending);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      router.events.off('routeChangeStart', flushPending);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flushPending();
    };
  }, [router.events]);

  // Handle tab change from URL hash
  useEffect(() => {
    const hash = router.asPath.split('#')[1] as TabId;
    if (hash && tabs.some((tab) => tab.id === hash)) {
      setActiveTab(hash);
    }
  }, [router.asPath]);

  useEffect(() => {
    const getCountries = async () => {
      const countryList: Array<{ label: string; value: string }> = [];
      try {
        const res = await api.get('/meta/countries');
        res.data.results.forEach((country: { name: string; code: string }) => {
          countryList.push({ label: country.name, value: country.code });
        });
        setCountries(countryList);
      } catch (err) {
        console.error('[SettingsPage] Error fetching countries:', err);
      }
    };
    getCountries();
  }, []);

  const readValue = (
    value: DraftValue | React.ChangeEvent<HTMLInputElement>,
  ): DraftValue =>
    typeof value === 'object' && !Array.isArray(value) && 'target' in value
      ? value.target.value
      : (value as DraftValue);

  /**
   * Writes every pending edit in a single PATCH. Keys are only dropped from the
   * draft when the value that was saved is still the value on screen, so
   * anything typed while the request was in flight survives and is picked up by
   * the next flush.
   */
  const flushDraft = async () => {
    const entries = Object.entries(draftRef.current);
    if (entries.length === 0) return;
    if (isSavingRef.current) {
      scheduleAutosave();
      return;
    }
    isSavingRef.current = true;

    const payload: Partial<User> = {};
    const preferencesPatch: Record<string, DraftValue> = {};
    const kycPatch: Record<string, string> = {};

    entries.forEach(([attribute, value]) => {
      if (PREFERENCE_FIELDS.includes(attribute)) {
        preferencesPatch[attribute] = value;
      } else if (KYC_FIELDS.includes(attribute)) {
        kycPatch[attribute] = Array.isArray(value) ? value.join(',') : value;
      } else {
        (payload as Record<string, DraftValue>)[attribute] = value;
      }
    });

    if (Object.keys(preferencesPatch).length > 0) {
      payload.preferences = {
        ...user?.preferences,
        ...preferencesPatch,
      } as User['preferences'];
    }

    if (Object.keys(kycPatch).length > 0) {
      // The API replaces `kycData` wholesale, so the untouched fields have to
      // be sent back alongside the edited ones.
      const existingKycData = user?.kycData;
      payload.kycData = {
        IP: existingKycData?.IP || '',
        dateRecorded: existingKycData?.dateRecorded || new Date(),
        legalName: existingKycData?.legalName || '',
        TIN: existingKycData?.TIN || '',
        address1: existingKycData?.address1 || '',
        postalCode: existingKycData?.postalCode || '',
        city: existingKycData?.city || '',
        state: existingKycData?.state || '',
        country: existingKycData?.country || '',
        ...kycPatch,
      } as User['kycData'];
    }

    try {
      setHasSaved(false);
      await platform.user.patch(user?._id, payload);
      // Show the saved values straight away; the refetch below only has to
      // keep the rest of the app in step.
      setUser((current) => (current ? { ...current, ...payload } : current));
      await refetchUser();
      const updatedUser = asUser((await api.get('/mine/user'))?.data?.results);
      if (updatedUser) {
        setUser(updatedUser);
      }
      setError(null);
      setHasSaved(true);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
      console.error('[settings] autosave failed:', errorMessage);
      return;
    } finally {
      isSavingRef.current = false;
    }

    // Only drop a field if what went out is still what is on screen — anything
    // typed while the request was open stays pending for the next flush.
    const remaining = { ...draftRef.current };
    entries.forEach(([attribute, value]) => {
      if (isSameDraftValue(remaining[attribute], value)) {
        delete remaining[attribute];
      }
    });
    writeDraft(remaining);
    if (Object.keys(remaining).length > 0) scheduleAutosave();
  };

  flushRef.current = flushDraft;

  const scheduleAutosave = () => {
    // One timer covers every field: a flush already on the clock will pick up
    // whatever else is edited before it fires.
    if (autosaveTimer.current) return;
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null;
      void flushRef.current();
    }, AUTOSAVE_INTERVAL_MS);
  };

  const flushNow = () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    void flushRef.current();
  };

  const saveUserData =
    (
      attribute:
        | keyof User['preferences']
        | keyof User
        | keyof User['settings']
        | keyof NonNullable<User['kycData']>,
    ): UpdateUserFunction =>
    async (value) => {
      writeDraft({ ...draftRef.current, [attribute]: readValue(value) });
      scheduleAutosave();
    };

  /** The value an input should show: the pending edit, else what is saved. */
  const fieldValue = (attribute: string, stored?: string | null) =>
    (attribute in draft ? (draft[attribute] as string) : stored) || '';

  const fieldValues = (attribute: string, stored?: string[] | string | null) => {
    const value = attribute in draft ? draft[attribute] : stored;
    if (Array.isArray(value)) return value;
    return value ? String(value).split(',') : [];
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
    const trimmed = phone.trim();
    if (!trimmed) {
      setError(t('settings_phone_required'));
      return;
    }
    setPhoneSaving(true);
    try {
      setPhoneSaved(false);
      await api.post('/auth/phone/update', { phone: trimmed });
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
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('settings_email_required'));
      return;
    }
    setEmailSaving(true);
    try {
      setEmailSaved(false);
      await api.post('/auth/email/update', { email: trimmed });
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
        <title>{`${user.screenname} | ${t('settings_page_title')}`}</title>
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
          <div className="flex-1 min-w-0">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('settings_account_information')}
                    </h3>
                  </div>

                  <Input
                    label={t('settings_name')}
                    placeholder={t('settings_your_name')}
                    value={fieldValue('screenname', user.screenname)}
                    onChange={saveUserData('screenname') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <div className="mb-6">
                    <Input
                      label={t('settings_email')}
                      labelBadge={
                        user.email_verified && !updateEmail ? (
                          <VerifiedBadge label={t('settings_verified')} />
                        ) : undefined
                      }
                      value={updateEmail ? emailDraft : user.email || ''}
                      isDisabled={!updateEmail}
                      onChange={(e) => setEmailDraft(e.target.value)}
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
                            onClick={() => saveEmail(emailDraft)}
                            isEnabled={!emailSaving}
                            variant="inline"
                          >
                            {emailSaving
                              ? t('settings_verifying')
                              : t('settings_verify_email')}
                          </Button>
                          <Button
                            onClick={() => toggleUpdateEmail(false)}
                            variant="inline"
                          >
                            {t('settings_cancel')}
                          </Button>
                        </div>
                      ) : (
                        !emailSaved && (
                          <Button
                            onClick={() => {
                              setEmailDraft(user.email || '');
                              toggleUpdateEmail(!updateEmail);
                            }}
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
                      labelBadge={
                        user.phone_verified && !updatePhone ? (
                          <VerifiedBadge label={t('settings_verified')} />
                        ) : undefined
                      }
                      isDisabled={!updatePhone}
                      value={updatePhone ? phoneDraft : user.phone || ''}
                      onChange={(e) => setPhoneDraft(e.target.value)}
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
                            onClick={() => savePhone(phoneDraft)}
                            isEnabled={!phoneSaving}
                            variant="inline"
                          >
                            {phoneSaving
                              ? t('settings_verifying')
                              : t('settings_verify_phone')}
                          </Button>
                          <Button
                            onClick={() => toggleUpdatePhone(false)}
                            variant="inline"
                          >
                            {t('settings_cancel')}
                          </Button>
                        </div>
                      ) : (
                        !phoneSaved && (
                          <Button
                            onClick={() => {
                              setPhoneDraft(user.phone || '');
                              toggleUpdatePhone(!updatePhone);
                            }}
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

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('settings_billing_information')}
                    </h3>
                  </div>

                  <Input
                    label={t('settings_legal_name')}
                    placeholder={t('settings_legal_name_placeholder')}
                    value={fieldValue('legalName', user?.kycData?.legalName)}
                    onChange={saveUserData('legalName') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_billing_address')}
                    placeholder={t('settings_billing_address_placeholder')}
                    value={fieldValue('address1', user?.kycData?.address1)}
                    onChange={saveUserData('address1') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Select
                    label={t('settings_country')}
                    value={fieldValue('country', user?.kycData?.country)}
                    options={countries}
                    className="mb-4"
                    onChange={async (value: string) => {
                      await saveUserData('country')(value);
                      flushNow();
                    }}
                    isRequired
                  />

                  <Input
                    label={t('settings_city')}
                    placeholder={t('settings_city_placeholder')}
                    value={fieldValue('city', user?.kycData?.city)}
                    onChange={saveUserData('city') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_postal_code')}
                    placeholder={t('settings_postal_code_placeholder')}
                    value={fieldValue('postalCode', user?.kycData?.postalCode)}
                    onChange={saveUserData('postalCode') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_tax_number')}
                    placeholder={t('settings_tax_number_placeholder')}
                    value={fieldValue('TIN', user?.kycData?.TIN)}
                    onChange={saveUserData('TIN') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                  />
                </div>

                {/* Deleting the account is an account action, so it lives at
                    the bottom of this section rather than in a tab of its own. */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-medium text-red-600">
                      {t('settings_delete_account')}
                    </h3>
                  </div>
                  <DeleteAccountSection t={t} />
                </div>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && areSubscriptionsEnabled && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('subscriptions_settings_title')}
                    </h3>
                  </div>
                  <SubscriptionSettings />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('settings_recommended_preferences')}
                    </h3>
                  </div>

                  <Select
                    label={t('settings_dietary_preferences')}
                    value={toSingleDiet(
                      'diet' in draft
                        ? (draft.diet as string)
                        : user?.preferences?.diet,
                    )}
                    onChange={async (value: string) => {
                      await saveUserData('diet')(value);
                      flushNow();
                    }}
                    options={dietOptions}
                    className="mb-4"
                  />

                  {APP_NAME && APP_NAME?.toLowerCase() !== 'moos' && (
                    <Select
                      label={t('settings_shared_accommodation_preference')}
                      value={fieldValue(
                        'sharedAccomodation',
                        user?.preferences?.sharedAccomodation,
                      )}
                      options={SHARED_ACCOMMODATION_PREFERENCES}
                      className="mb-4"
                      onChange={async (value: string) => {
                        await saveUserData('sharedAccomodation')(value);
                        flushNow();
                      }}
                      isRequired
                    />
                  )}

                  <Input
                    label={t('settings_superpower')}
                    placeholder={t('settings_superpower_placeholder')}
                    value={fieldValue('superpower', user?.preferences?.superpower)}
                    onChange={saveUserData('superpower') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <MultiSelect
                    label={t('settings_skills')}
                    values={fieldValues('skills', user?.preferences?.skills)}
                    onChange={async (value) => {
                      await saveUserData('skills')(value);
                      flushNow();
                    }}
                    options={skillsOptions}
                    placeholder={t('settings_pick_or_create_yours')}
                    className="mb-4"
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-gray-700" />
                    <h3 className="text-lg font-medium text-gray-900">
                      {t('settings_optional_information')}
                    </h3>
                  </div>

                  <Input
                    label={t('settings_dream')}
                    placeholder={t('settings_dream_placeholder')}
                    value={fieldValue('dream', user?.preferences?.dream)}
                    onChange={saveUserData('dream') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_needs')}
                    placeholder=""
                    value={fieldValue('needs', user?.preferences?.needs)}
                    onChange={saveUserData('needs') as any}
                    onBlur={flushNow}
                    isInstantSave={true}
                    hasSaved={hasSaved}
                    setHasSaved={setHasSaved}
                    className="mb-4"
                  />

                  <Input
                    label={t('settings_more_info')}
                    placeholder=""
                    value={fieldValue('moreInfo', user?.preferences?.moreInfo)}
                    onChange={saveUserData('moreInfo') as any}
                    onBlur={flushNow}
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
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
