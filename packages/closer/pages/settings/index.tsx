import Head from 'next/head';

import { FC, useState } from 'react';

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

type UpdateUserFunction = (value: string | string[]) => Promise<void>;

const SHARED_ACCOMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

const SKILLS_EXAMPLES = ['javascript', 'woodworking', 'farming', 'cooking', 'gardening', 'plumbing', 'carpentry'];

const SettingsPage: FC = () => {
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [phoneSaved, setPhoneSaved] = useState<boolean | null>(null);
  const [emailSaved, setEmailSaved] = useState<boolean | null>(null);
  const [hasSaved, setHasSaved] = useState(false);
  const { platform } = usePlatform() as any;

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
    try {
      setPhoneSaved(false);
      await api.post('/auth/phone/update', { phone });
      setError(null);
      setPhoneSaved(true);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    }
  }
  const saveEmail = async (email: string) => {
    try {
      setEmailSaved(false);
      await api.post('/auth/email/update', { email });
      setError(null);
      setEmailSaved(true);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    }
  }

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Sorry, this page does not exist" />;
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
          onChange={saveUserData('screenname') as any}
          className="mt-4"
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
        <Input
          label="Email"
          value={user.email}
          onChange={email => saveEmail(email)}
          successMessage={emailSaved ? 'You will receive a link to confirm via email.' : undefined}
          className="mt-8"
          validation="email"
          isInstantSave={true}
        />
        <Input
          label="Phone"
          value={user.phone}
          onChange={phone => savePhone(phone)}
          successMessage={ phoneSaved ? 'You will receive a link to confirm via text.' : undefined }
          className="mt-8"
          validation="phone"
          isInstantSave={true}
        />
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
