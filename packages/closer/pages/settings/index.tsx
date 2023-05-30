import Head from 'next/head';

import { FC, useEffect, useState } from 'react';

import UploadPhoto from '../../components/UploadPhoto';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';
import MultiSelect from '../../components/ui/Select/MultiSelect';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { type User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { parseMessageFromError } from '../../utils/common';
import api from '../../utils/api';
import { Button } from '../../components/ui';

type UpdateUserFunction = (value: string | string[]) => Promise<void>;

const SHARED_ACCOMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

const SKILLS_EXAMPLES = ['javascript', 'woodworking', 'farming', 'cooking', 'gardening', 'plumbing', 'carpentry'];

const SettingsPage: FC = () => {
  const { user: initialUser, isAuthenticated, refetchUser } = useAuth();
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
    (attribute: keyof User['preferences'] | keyof User): UpdateUserFunction =>
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
  }
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
  }

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Please log in to see this page." />;
  }

  return (
    <>
      <Head>
        <title>{user.screenname} | About me</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col min-h-screen py-2">
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
          ⭐ Account
        </Heading>
        <Input
          label="Name"
          value={user.screenname}
          onChange={saveUserData('screenname')}
          className="mt-4"
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <Input
          label="Email"
          value={user.email}
          isDisabled={!updateEmail}
          onChange={email => setUser({ ...user, email })}
          successMessage={emailSaved ? 'You will receive a link to confirm via email.' : undefined}
          className="mt-8"
          validation="email"
        />
        <div className="mt-4">
          {updateEmail && !emailSaved ?
            <>
              <Button
                onClick={() => saveEmail(user.email)}
                isEnabled={ !emailSaving }
                type="inline"
              >
                {emailSaving ? 'Verifying...' : 'Verify Email'}
              </Button> 
              <Button
                onClick={() => { setUser({ ...user, email: initialUser?.email || user.email }); toggleUpdateEmail(false) }}
                className="ml-4"
                type="inline"
              >
                Cancel
              </Button>
            </>:
            !emailSaved &&
            <Button
              onClick={() => toggleUpdateEmail(!updateEmail)}
              type="inline"
            >
              Edit Email
            </Button>
          }
        </div>
        
        <Input
          label="Phone"
          isDisabled={!updatePhone}
          value={user.phone}
          onChange={phone => setUser({ ...user, phone })}
          successMessage={ phoneSaved ? 'You will receive a link to confirm via text.' : undefined }
          className="mt-8"
          validation="phone"
        />
        <div className="mt-4">
          { updatePhone && !phoneSaved ?
            <>
              <Button
                onClick={() => savePhone(user.phone)}
                isEnabled={!phoneSaving}
                type="inline"
              >
                {phoneSaving ? 'Verifying...' : 'Verify Phone' }
              </Button>
              <Button
                onClick={() => { setUser({ ...user, phone: initialUser?.phone || user.phone }); toggleUpdatePhone(false) }}
                className="ml-4"
                type="inline"
              >
                Cancel
              </Button>
            </> :
            !phoneSaved &&
            <Button
              onClick={() => toggleUpdatePhone(!updatePhone)}
              type="inline"
            >
              Edit Phone
            </Button>
          }
        </div>

        <div className="md:w-72 relative mt-8">
          <label className="font-medium text-complimentary-light" htmlFor="">
            Profile Picture
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
          🔰 Recommended
        </Heading>
        <Input
          label="Dietary Preferences"
          className="mt-4"
          onChange={saveUserData('diet') as any}
          value={user?.preferences?.diet}
          isInstantSave={true}
        />
        <Select
          label="Shared Accommodation Preference"
          value={user?.preferences?.sharedAccomodation}
          options={SHARED_ACCOMODATION_PREFERENCES}
          className="mt-8"
          onChange={saveUserData('sharedAccomodation')}
          isRequired
        />
        <Input
          label="What is your superpower?"
          value={user?.preferences?.superpower}
          onChange={saveUserData('superpower') as any}
          className="mt-8"
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <MultiSelect
          label="What skills do you have?"
          values={user?.preferences?.skills}
          className="mt-8"
          onChange={saveUserData('skills')}
          options={SKILLS_EXAMPLES}
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
          value={user?.preferences?.dream}
          onChange={saveUserData('dream') as any}
          className="mt-4"
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <Input
          label="What do you need?"
          value={user?.preferences?.needs}
          className="mt-8"
          onChange={saveUserData('needs') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <Input
          label="Anything we should know? Anything you would like to share?"
          value={user?.preferences?.moreInfo}
          className="mt-8"
          onChange={saveUserData('moreInfo') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
      </div>
    </>
  );
};

export default SettingsPage;