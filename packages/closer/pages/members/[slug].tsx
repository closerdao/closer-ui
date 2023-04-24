import Head from 'next/head';

import { FC, useState } from 'react';
import React from 'react';

import UploadPhoto from '../../components/UploadPhoto';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

import PageNotFound from '../404';
import { useAuth } from '../../contexts/auth';
import { type User } from '../../contexts/auth/types';
import { usePlatform } from '../../contexts/platform';
import { parseMessageFromError } from '../../utils/common';

type UpdateUserFunction = (value: string) => Promise<void>;

const DIETARY_PREFERENCES = [
  { label: 'Vegan', value: 'vegan' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Pescatarian', value: 'pescatarian' },
  { label: 'Omnivore', value: 'omnivore' },
  { label: 'Allergies', value: 'allergies' },
];

// Flexible/Male Only/Female Only
const SHARED_ACCOMODATION_PREFERENCES = [
  { label: 'Flexible', value: 'flexible' },
  { label: 'Male Only', value: 'male only' },
  { label: 'Female Only', value: 'female only' },
];

const SKILLS_EXAMPLES = [
  { label: 'Javascript', value: 'javascript' },
  { label: 'Woodworking', value: 'woodworking' },
  { label: 'Farming', value: 'farming' },
];

const MemberPage: FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { platform } = usePlatform() as any;

  const saveUserData =
    (attribute: keyof User['preferences'] | keyof User): UpdateUserFunction =>
    async (value: string) => {
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
        setError(null);
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
      }
    };

  if (!isAuthenticated || !user) {
    return <PageNotFound error="Page does not exist" />;
  }

  return (
    <>
      <Head>
        <title>{user.screenname}</title>
      </Head>
      <div className="main-content w-full flex flex-col min-h-screen py-2">
        <Heading>🤓 Your Info</Heading>
        <Heading level={2} className="mt-16">
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
        />
        <div className="md:w-72 relative mt-8">
          <label className="font-medium text-complimentary-light">
            Profile Picture
          </label>
          <UploadPhoto
            model="user"
            id={user._id}
            label={user.photo ? 'Change' : 'Add photo'}
            className="my-4"
          />
        </div>
        <Heading level={2} className="mt-16">
          🔰 Recommended
        </Heading>
        <Select
          label="Dietary Preferences"
          options={DIETARY_PREFERENCES}
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
        />
        <Input
          label="What is your superpower?"
          value={user?.preferences?.superpower}
          onChange={saveUserData('email')}
          className="mt-8"
        />
        <Select
          label="What skills do you have?"
          value={user?.preferences?.skills}
          className="mt-8"
          onChange={saveUserData('skills')}
          options={SKILLS_EXAMPLES}
          isMulti
        />
        <Heading level={2} className="mt-16">
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
          value={user?.preferences?.needs}
          className="mt-8"
          onChange={saveUserData('needs')}
        />
      </div>
    </>
  );
};

export default MemberPage;
