import Head from 'next/head';

import { ChangeEvent, useState } from 'react';

import { useConfig } from '@/../../packages/closer';
import { __ } from '@/../../packages/closer/utils/helpers';

import BackButton from '@/../../packages/closer/components/ui/BackButton';
import Button from '@/../../packages/closer/components/ui/Button';
import Checkbox from '@/../../packages/closer/components/ui/Checkbox';
import Heading from '@/../../packages/closer/components/ui/Heading';
import Input from '@/../../packages/closer/components/ui/Input';
import ProgressBar from '@/../../packages/closer/components/ui/ProgressBar';
import Wrapper from '@/../../packages/closer/components/ui/Wrapper';

// TODO:
// add locales variables everywhere
// add Barlow font

const AboutYou = () => {
  // const { user } = useAuth();
  // const router = useRouter();

  const [email, setEmail] = useState('');
  const [about, setAbout] = useState('');

  const { PLATFORM_NAME } = useConfig() || {};

  const submitHandler = (e: ChangeEvent<HTMLFormElement>) => {};

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_about_you_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={() => null}>{__('buttons_back')}</BackButton>

        <Heading level={1}>
          <span className="mr-1">🤓</span>
          <span>{__('subscriptions_about_you_title')}</span>
        </Heading>

        <ProgressBar />

        <Wrapper className="mt-16 mb-24 flex gap-0 w-full flex-col md:flex-row flex-wrap">
          <Heading level={2}>⭐ Required</Heading>

          <form onSubmit={submitHandler} className="flex flex-wrap w-full">
            <Input
              value={email}
              placeholder="Your name"
              type="text"
              label="Name"
              changeHandler={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              information="Additional in fromation"
            />

            <Input
              value={about}
              placeholder="about you"
              type="text"
              label="Tell us about yourself"
              changeHandler={(e: ChangeEvent<HTMLInputElement>) =>
                setAbout(e.target.value)
              }
            />

            <Input
              value={email}
              placeholder="Your name"
              type="text"
              label="Name"
              changeHandler={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              information="Additional in fromation"
            />

            <Heading level={2} className="mt-6">
              🔰 Recommended
            </Heading>

            <Input
              value={email}
              placeholder="Your name"
              type="text"
              label="Name"
              changeHandler={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              information="Additional in fromation"
            />

            <Heading level={2} className="mt-6">
              🔰 Optional
            </Heading>

            <Input
              value={email}
              placeholder="Your name"
              type="text"
              label="Name"
              changeHandler={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              information="Additional in fromation"
            />

            <div
              className="mb-8
            "
            >
              <Checkbox
                checked={false}
                changeHandler={() => {}}
                className=""
                label={__('bookings_checkout_step_comply_with')}
              />
              <Checkbox
                checked={true}
                changeHandler={() => {}}
                className=""
                label={__('bookings_checkout_step_comply_with')}
              />
            </div>

            <Button>Subscribe</Button>
          </form>
        </Wrapper>
      </div>
    </>
  );
};

export default AboutYou;
