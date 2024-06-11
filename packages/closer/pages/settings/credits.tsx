import Head from 'next/head';

import { FC } from 'react';

import Profile from '../../components/Profile';
import RedeemCredits from '../../components/RedeemCredits';
import { Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { Page404 } from '../..';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { __ } from '../../utils/helpers';

const CreditsPage: FC = () => {
  const { APP_NAME } = useConfig();
  const { platform }: any = usePlatform();

  if (process.env.NEXT_PUBLIC_FEATURE_CARROTS !== 'true') {
    return <Page404 error="" />;
  }

  return (
    <>
      <Head>
        <title>{APP_NAME && __('carrots_heading', APP_NAME)}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-12  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            <div className="text-6xl w-full flex justify-center">
              {APP_NAME && __('carrots_balance', APP_NAME)}
            </div>
            {APP_NAME && __('carrots_heading', APP_NAME)}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {' '}
            {APP_NAME && __('carrots_subheading', APP_NAME)}
          </Heading>
        </div>

        <Card>
          <div className="flex">
            <Heading level={3} className="w-1/2">
              {__('carrots_your_balance')}
            </Heading>
            <Heading level={3} className="w-1/2 text-right">
              {(platform.carrots.findBalance('carrots') || 0).toFixed(2)}{' '}
              {APP_NAME && __('carrots_balance', APP_NAME)}
            </Heading>
          </div>
        </Card>

        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <Heading level={3}>
            {__('carrots_subheading_what_are', APP_NAME)}
          </Heading>
        )}

        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <div>
            <p className="mb-4">{__('carrots_what_are_1', APP_NAME)}</p>
            <p className="mb-4">{__('carrots_what_are_2', APP_NAME)}</p>
          </div>
        )}

        <Heading level={3}>
          {APP_NAME && __('carrots_subheading_what', APP_NAME)}
        </Heading>

        <div>
          <p className="mb-4">{APP_NAME && __('carrots_what_1', APP_NAME)}</p>
          <p className="mb-4">{APP_NAME && __('carrots_what_2', APP_NAME)}</p>
          {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
            <p className="mb-4">{__('carrots_what_2.5', APP_NAME)}</p>
          )}
          <p className="mb-4">{APP_NAME && __('carrots_what_3', APP_NAME)}</p>
          <p className="mb-4">{APP_NAME && __('carrots_what_4', APP_NAME)}</p>

          {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
            <>
              <p className="mb-4">{__('carrots_what_5', APP_NAME)}</p>
              <p className="mb-4">{__('carrots_what_6', APP_NAME)}</p>
            </>
          )}
        </div>

        <Heading level={3}>{__('carrots_subheading_where')}</Heading>

        <div>
          <p className="mb-4">{__('carrots_where_1')}</p>
          <Profile isDemo={true} />
        </div>

        {APP_NAME && (
          <>
            <Heading level={3}>{__('carrots_subheading_how_to_use')}</Heading>

            <div>
              <p className="mb-4">{__('carrots_how_to_use_1', APP_NAME)}</p>
              <p className="mb-4">{__('carrots_how_to_use_2', APP_NAME)}</p>
              <p className="mb-4">{__('carrots_how_to_use_3', APP_NAME)}</p>
              <p className="mb-4">{__('carrots_how_to_use_4', APP_NAME)}</p>
              {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
                <><p className="mb-4">{__('carrots_how_to_use_5', APP_NAME)}</p>
                <p className="mb-4">{__('carrots_how_to_use_6', APP_NAME)}</p></>
              )}
            </div>
          </>
        )}

        <RedeemCredits isDemo={true} />

        {/* {APP_NAME && APP_NAME.toLowerCase() !== 'moos' && (
          <>
            <Heading level={3}>{__('carrots_subheading_how_to_earn')}</Heading>

            <div>
              <p className="mb-4">{__('carrots_how_to_earn_1')}</p>
              <p className="mb-4">{__('carrots_how_to_earn_2')}</p>
              <p className="mb-4">{__('carrots_how_to_earn_3')}</p>
              <p className="mb-4">{__('carrots_how_to_earn_4')}</p>
            </div>
          </>
        )} */}
        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <>
            <Heading level={3}>
              {__('carrots_additional_guidelines_heading', APP_NAME)}
            </Heading>

            <div>
              <p className="mb-4">
                {__('carrots_additional_guidelines_1', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_2', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_3', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_4', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_5', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_6', APP_NAME)}
              </p>
              <p className="mb-4">
                {__('carrots_additional_guidelines_7', APP_NAME)}
              </p>
              <p className="mb-4">
                {APP_NAME &&
                    APP_NAME.toLowerCase() !== 'moos' &&
                    __('carrots_additional_guidelines_8', APP_NAME)}              </p>
              <p className="mb-4">
                {APP_NAME &&
                  APP_NAME.toLowerCase() !== 'moos' &&
                  __('carrots_additional_guidelines_9', APP_NAME)}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CreditsPage;
