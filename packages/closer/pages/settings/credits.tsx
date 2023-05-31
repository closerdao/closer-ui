import Head from 'next/head';
import { useRouter } from 'next/router';

import { FC, useEffect } from 'react';

import Profile from '../../components/Profile';
import RedeemCredits from '../../components/RedeemCredits';
import { Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { __ } from '../../utils/helpers';
import { Page404 } from '../..';

const CreditsPage: FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { platform }: any = usePlatform();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push(`/login?back=${router.asPath}`);
    }
  }, [isAuthenticated, user]);
  
  if (process.env.NEXT_PUBLIC_FEATURE_CARROTS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>{__('carrots_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-12  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            <div className="text-6xl w-full flex justify-center">🥕</div>
            {__('carrots_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {' '}
            {__('carrots_subheading')}
          </Heading>
        </div>

        <Card>
          <div className="flex">
            <Heading level={3} className="w-1/2">
              {__('carrots_your_balance')}
            </Heading>
            <Heading level={3} className="w-1/2 text-right">
              {(platform.carrots.findBalance('carrots') || 0).toFixed(2)} 🥕
            </Heading>
          </div>
        </Card>

        <Heading level={3}>{__('carrots_subheading_what')}</Heading>

        <div>
          <p className="mb-4">{__('carrots_what_1')}</p>
          <p className="mb-4">{__('carrots_what_2')}</p>
          <p className="mb-4">{__('carrots_what_3')}</p>
          <p className="mb-4">{__('carrots_what_4')}</p>
        </div>

        <Heading level={3}>{__('carrots_subheading_where')}</Heading>

        <div>
          <p className="mb-4">{__('carrots_where_1')}</p>
          <Profile />
        </div>

        <Heading level={3}>{__('carrots_subheading_how_to_use')}</Heading>

        <div>
          <p className="mb-4">{__('carrots_how_to_use_1')}</p>
          <p className="mb-4">{__('carrots_how_to_use_2')}</p>
          <p className="mb-4">{__('carrots_how_to_use_3')}</p>
          <p className="mb-4">{__('carrots_how_to_use_4')}</p>
        </div>

        <RedeemCredits isDemo={true} />

        <Heading level={3}>{__('carrots_subheading_how_to_harvest')}</Heading>

        <ul className="list-disc pl-5">
          <li>{__('carrots_how_to_harvest_1')}</li>
          <li>{__('carrots_how_to_harvest_2')}</li>
          <li>{__('carrots_how_to_harvest_3')}</li>
          <li>{__('carrots_how_to_harvest_4')}</li>
        </ul>
      </div>
    </>
  );
};

export default CreditsPage;
