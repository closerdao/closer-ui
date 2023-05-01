import Head from 'next/head';

import { FC, useState } from 'react';
import React from 'react';

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

type UpdateUserFunction = (value: string | string[]) => Promise<void>;

const SHARED_ACCOMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

const SKILLS_EXAMPLES = ['javascript', 'woodworking', 'farming'];

const SettingsPage: FC = () => {
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
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
        await platform.user.patch(user?._id, payload);
        await refetchUser();
        setError(null);
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
      }
    };

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
        <Heading level={3} className="border-b border-divider pb-2.5 leading-9 mt-12">
          ⭐ Account
        </Heading>
        <Input
          label="Name"
          value={user.screenname}
          onChange={saveUserData('screenname')}
          className="mt-4"
        />
        <Input
          label="Email"
          value={user.email}
          onChange={saveUserData('email')}
          className="mt-8"
          validation="email"
          isDisabled
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
        <Heading level={3} className="border-b border-divider pb-2.5 leading-9 mt-12">
          🔰 Recommended
        </Heading>
        <Input
          label="Dietary Preferences"
          className="mt-4"
          onChange={saveUserData('diet')}
          value={user?.preferences?.diet}
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
          onChange={saveUserData('superpower')}
          className="mt-8"
        />
        <MultiSelect
          label="What skills do you have?"
          values={user?.preferences?.skills}
          className="mt-8"
          onChange={saveUserData('skills')}
          options={SKILLS_EXAMPLES}
          placeholder="Pick or create yours"
        />
        <Heading level={3} className="border-b border-divider pb-2.5 leading-9 mt-12">
          🔰 Optional
        </Heading>
        <Input
          label="What do you dream of creating?"
          value={user?.preferences?.dream}
          onChange={saveUserData('dream')}
          className="mt-4"
        />
        <Input
          label="What do you need?"
          value={user?.preferences?.needs}
          className="mt-8"
          onChange={saveUserData('needs')}
        />
        <Input
          label="Anything we should know? Anything you would like to share?"
          value={user?.preferences?.moreInfo}
          className="mt-8"
          onChange={saveUserData('moreInfo')}
        />
      </div>
    </>
  );
};

export default SettingsPage;
