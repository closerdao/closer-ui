import Head from 'next/head';

import { useEffect, useState } from 'react';

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
  const { platform } = usePlatform() as any;

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

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
      // Logging for debugging
      console.log('[saveUserData] attribute:', attribute);
      console.log('[saveUserData] value:', value);
      console.log('[saveUserData] payload:', payload);
      console.log('[saveUserData] user?._id:', user?._id);
      try {
        setHasSaved(false);
        const result = await platform.user.patch(user?._id, payload);
        console.log('[saveUserData] patch result:', result);
        await refetchUser();
        setError(null);
        setHasSaved(true);
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
        <title>{user.screenname} | About me</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col min-h-screen py-2 gap-10">
        <Heading>🤓 Your Info</Heading>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-8">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <Heading
          level={3}
          className="border-b border-divider pb-2.5 leading-9 mt-12"
        >
          ⭐ Profile
        </Heading>

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
        />

        <div className="relative mt-8 flex flex-col gap-6 group">
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

        <Heading
          level={3}
          className="border-b border-divider pb-2.5 leading-9 mt-12"
        >
          ⭐ Account
        </Heading>

        <Input
          label="Name"
          placeholder="Your name"
          value={user.screenname}
          onChange={saveUserData('screenname') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
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
        />
        <div>
          {updateEmail && !emailSaved ? (
            <>
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
                className="ml-4"
                variant="inline"
              >
                Cancel
              </Button>
            </>
          ) : (
            !emailSaved && (
              <Button
                onClick={() => toggleUpdateEmail(!updateEmail)}
                variant="inline"
              >
                Edit Email
              </Button>
            )
          )}
        </div>

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
        />
        <div>
          {updatePhone && !phoneSaved ? (
            <>
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
                className="ml-4"
                variant="inline"
              >
                Cancel
              </Button>
            </>
          ) : (
            !phoneSaved && (
              <Button
                onClick={() => toggleUpdatePhone(!updatePhone)}
                variant="inline"
              >
                Edit Phone
              </Button>
            )
          )}
        </div>

        <div id="recommended"></div>
        <Heading
          level={3}
          className="border-b border-divider pb-2.5 leading-9 mt-12"
        >
          🔰 Recommended
        </Heading>

        <MultiSelect
          label="Dietary Preferences?"
          values={initialDiet}
          onChange={saveUserData('diet')}
          options={dietOptions}
          placeholder="Pick or create yours"
        />

        {APP_NAME && APP_NAME.toLowerCase() !== 'moos' && (
          <Select
            label="Shared Accommodation Preference"
            value={user?.preferences?.sharedAccomodation}
            options={SHARED_ACCOMODATION_PREFERENCES}
            className="mt-8"
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
        />
        <MultiSelect
          label="What skills do you have?"
          values={user?.preferences?.skills}
          onChange={saveUserData('skills')}
          options={skillsOptions}
          placeholder="Pick or create yours"
        />
        <Heading
          level={3}
          className="border-b border-divider pb-2.5 leading-9 mt-12"
        >
          🔰 Optional
        </Heading>
        <Input
          label="What do you dream of creating?"
          placeholder="I dream of creating ..."
          value={user?.preferences?.dream}
          onChange={saveUserData('dream') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <Input
          label="What is one thing you currently need support with?"
          placeholder=""
          value={user?.preferences?.needs}
          onChange={saveUserData('needs') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
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
        <Heading
          level={3}
          className="border-b border-divider pb-2.5 leading-9 mt-12"
        >
          🔰 Notifications
        </Heading>
        <div className="flex items-center justify-start gap-2">
          <Checkbox
            isChecked={user?.settings?.newsletter_weekly}
            onChange={saveSettings('newsletter_weekly')}
          />
          <label>Weekly newsletter</label>
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
