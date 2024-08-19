import Head from 'next/head';

import Profile from '../../components/Profile';
import RedeemCredits from '../../components/RedeemCredits';
import { Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { loadLocaleData } from '../../utils/locale.helpers';
import PageNotFound from '../not-found';

const CreditsPage = () => {
  const t = useTranslations();
  const { APP_NAME } = useConfig();
  const { platform }: any = usePlatform();

  if (process.env.NEXT_PUBLIC_FEATURE_CARROTS !== 'true') {
    return <PageNotFound error="" />;
  }

  return (
    <>
      <Head>
        <title>{ t('carrots_heading')}</title>
      </Head>
      <div className="max-w-screen-sm mx-auto md:p-8 h-full main-content w-full flex flex-col gap-12  min-h-screen py-2">
        <div className="bg-accent-light rounded-md p-6 flex flex-wrap content-center justify-center">
          <Heading level={1} className="flex justify-center flex-wrap">
            <div className="text-6xl w-full flex justify-center">
              { t('carrots_balance')}
            </div>
            { t('carrots_heading')}
          </Heading>
          <Heading
            level={2}
            className="p-4 text-xl text-center font-normal w-full"
          >
            {' '}
            {t('carrots_subheading')}
          </Heading>
        </div>
        <Card>
          <div className="flex">
            <Heading level={3} className="w-1/2">
              {t('carrots_your_balance')}
            </Heading>
            <Heading level={3} className="w-1/2 text-right">
              {(platform.carrots.findBalance('carrots') || 0).toFixed(2)}{' '}
              {t('carrots_balance')}
            </Heading>
          </div>
        </Card>
        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <Heading level={3}>
            {t('carrots_subheading_what_are')}
          </Heading>
        )}
        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <div>
            <p className="mb-4">{t('carrots_what_are_1')}</p> 
            <p className="mb-4">{t('carrots_what_are_2')}</p>
          </div>
        )}
        <Heading level={3}>{t('carrots_subheading_what')}</Heading>
        <div>
          <p className="mb-4">{t('carrots_what_1')}</p>
          <p className="mb-4">{t('carrots_what_2')}</p>
          {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
            <p className="mb-4">{t('carrots_what_2_5')}</p>
          )}
          <p className="mb-4">{t('carrots_what_3')}</p>
          <p className="mb-4">{t('carrots_what_4')}</p>

          {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
            <>
              <p className="mb-4">{t('carrots_what_5')}</p>
              <p className="mb-4">{t('carrots_what_6')}</p>
            </>
          )}
        </div>
        <Heading level={3}>{t('carrots_subheading_where')}</Heading>
        <div>
          <p className="mb-4">{t('carrots_where_1')}</p>
          <Profile isDemo={true} />
        </div>

        <Heading level={3}>{t('carrots_subheading_how_to_use')}</Heading>

        {APP_NAME && (
          <>
            <Heading level={3}>{t('carrots_subheading_how_to_use')}</Heading>

            <div>
              <p className="mb-4">{t('carrots_how_to_use_1')}</p>
              <p className="mb-4">{t('carrots_how_to_use_2')}</p>
              <p className="mb-4">{t('carrots_how_to_use_3')}</p>
              <p className="mb-4">{t('carrots_how_to_use_4')}</p>
              {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
                <>
                  <p className="mb-4">{t('carrots_how_to_use_5')}</p>
                  <p className="mb-4">{t('carrots_how_to_use_6')}</p>
                </>
              )}
            </div>
          </>
        )}

        <RedeemCredits isDemo={true} />
        {/* {APP_NAME && APP_NAME.toLowerCase() !== 'moos' && (
          <>
            <Heading level={3}>{t('carrots_subheading_how_to_earn')}</Heading>

            <div>
              <p className="mb-4">{t('carrots_how_to_earn_1')}</p>
              <p className="mb-4">{t('carrots_how_to_earn_2')}</p>
              <p className="mb-4">{t('carrots_how_to_earn_3')}</p>
              <p className="mb-4">{t('carrots_how_to_earn_4')}</p>
            </div>
          </>
        )} */}
        {APP_NAME && APP_NAME.toLowerCase() === 'moos' && (
          <>
            <Heading level={3}>
              {t('carrots_additional_guidelines_heading')}
            </Heading>

            <div>
              <p className="mb-4">
                {t('carrots_additional_guidelines_1')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_2')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_3')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_4')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_5')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_6')}
              </p>
              <p className="mb-4">
                {t('carrots_additional_guidelines_7')}
              </p>
              <p className="mb-4">
                {APP_NAME &&
                  APP_NAME.toLowerCase() !== 'moos' &&
                  t('carrots_additional_guidelines_8')}{' '}
              </p>
              <p className="mb-4">
                {APP_NAME &&
                  APP_NAME.toLowerCase() !== 'moos' &&
                  t('carrots_additional_guidelines_9')}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

CreditsPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default CreditsPage;
