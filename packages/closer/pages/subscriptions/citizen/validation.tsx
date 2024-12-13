import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useMemo, useState } from 'react';

import PageError from '../../../components/PageError';
import Wallet from '../../../components/Wallet';
import {
  BackButton,
  Button,
  Checkbox,
  Heading,
  Input,
  ProgressBar,
} from '../../../components/ui';

import { NextPage, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { SUBSCRIPTION_CITIZEN_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import { Booking, GeneralConfig } from '../../../types';
import {
  SubscriptionPlan, // Tier,
} from '../../../types/subscriptions';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

interface Props {
  subscriptionsConfig: { enabled: boolean; elements: SubscriptionPlan[] };

  generalConfig: GeneralConfig | null;
  error?: string;
}

const ValidationCitizenPage: NextPage<Props> = ({
  subscriptionsConfig,

  generalConfig,
  error,
}) => {
  const t = useTranslations();
  const { isLoading, user } = useAuth();
  const { PLATFORM_NAME } = useConfig();
  const { platform }: any = usePlatform();
  const router = useRouter();

  const {
    balanceTotal,
    balanceAvailable,
    isWalletReady,
    isWalletConnected,
    isCorrectNetwork,
  } = useContext(WalletState);
  const minVouchingStayDuration = generalConfig?.minVouchingStayDuration || 14;

  console.log('balanceTotal===>', balanceTotal);
  const owns30Tokens = balanceTotal >= 30;

  const areSubscriptionsEnabled =
    subscriptionsConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true';
  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  const [isEligibleForFinanceTokens, setIsEligibleForFinanceTokens] =
    useState(false);
  const [meetsMemberCriteria, setMeetsMemberCriteria] = useState(false);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>();

  const isMember = user?.roles?.includes('member');
  console.log('isMember', isMember);

  const vouchedBy3Members = Boolean(user?.vouched && user?.vouched.length >= 3);

  const getCtaButtonText = () => {

   
    if (owns30Tokens && application?.iOwnTokens) {
      return t('apply_submit_button');
    } else if (!isEligibleForFinanceTokens) {
      return t('subscriptions_citizen_see_other_ways');
    }
    return t('booking_button_continue');
  };

  const bookingsToFetchLimit = 15;
  const filter = useMemo(
    () => ({
      where: {
        createdBy: user?._id,
        status: [
          'tokens-staked',
          'credits-paid',
          'paid',
          'checked-in',
          'checked-out',
          'pending-refund',
        ],
        end: { $lt: new Date() },
      },
      limit: bookingsToFetchLimit,
    }),
    [user?._id],
  );

  const pastBookings = platform.booking.find(filter);

  const totalStayDays =
    pastBookings?.toJS()?.reduce((acc: number, booking: Booking) => {
      return acc + booking.duration;
    }, 0) || 0;

  const hasStayedForMinDuration = totalStayDays >= minVouchingStayDuration;

  useEffect(() => {
    loadData();
  }, [filter]);

  useEffect(() => {
    console.log('vouchedBy3Members', vouchedBy3Members);
    console.log('hasStayedForMinDuration', hasStayedForMinDuration);
    console.log('owns30Tokens', owns30Tokens);
    if ((vouchedBy3Members && hasStayedForMinDuration) || isMember) {
      setIsEligibleForFinanceTokens(true);
      if (owns30Tokens) {
        setMeetsMemberCriteria(true);
      }
    } else {
      setIsEligibleForFinanceTokens(false);
      setMeetsMemberCriteria(false);
    }
  }, [vouchedBy3Members, owns30Tokens, hasStayedForMinDuration, isMember]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/signup?back=${router.asPath}`);
    }
  }, [user, isLoading]);

  async function loadData() {
    try {
      setLoading(true);
      await Promise.all([platform.booking.get(filter)]);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }

  const updateApplication = (key: string, value: any) => {
    setApplication((prev: any) => ({ ...prev, [key]: value }));
  };

  const goBack = () => {
    router.push('/subscriptions/');
  };

  if (error) {
    return <PageError error={error} />;
  }

  if (!areSubscriptionsEnabled) {
    return <PageNotFound error="" />;
  }

  const handleNext = async () => {
    console.log('validateUserEligibility');
  };

  return (
    <>
      <Head>
        <title>{`${t('subscriptions_citizen_apply_title')} - ${t(
          'subscriptions_title',
        )} - ${PLATFORM_NAME}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BackButton handleClick={goBack}>{t('buttons_back')}</BackButton>

        <Heading level={1} className="mb-4">
          {t('subscriptions_citizen_apply_title')}
        </Heading>

        <ProgressBar steps={SUBSCRIPTION_CITIZEN_STEPS} />

        <main className="pt-14 pb-24 space-y-6">
          <div className="mb-10">
            <Heading level={2} className="border-b pb-2 mb-6 text-xl">
              {hasStayedForMinDuration && vouchedBy3Members
                ? t('subscriptions_citizen_good_to_go')
                : t('subscriptions_citizen_not_eligible')}
            </Heading>
          </div>

          <p>{t('subscriptions_citizen_good_to_go_intro')}</p>
          <div>
            {!hasStayedForMinDuration || !vouchedBy3Members || !isMember ? (
              <div  className='space-y-6'>
                <p className=''>{t('subscriptions_citizen_not_eligible_reason')}</p>

                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('subscriptions_citizen_created_account')}
                  </li>
                  {user?.reports && user?.reports?.length > 0 ? (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_no_reports')}
                    </li>
                  ) : (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_no_reports')}
                    </li>
                  )}
                  {user?.subscription.plan === 'citizen' && (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_on_way_to_30_tokens')}
                    </li>
                  )}
                  {!hasStayedForMinDuration && (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_stayed_for_min_duration')}
                    </li>
                  )}
                  {!vouchedBy3Members && (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_vouched_by_3_members')}
                    </li>
                  )}
                  {!owns30Tokens && (
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('subscriptions_citizen_owns_30_tokens')}
                    </li>
                  )}
                  {/* {!isMember && <li className='bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet-inactive.svg)] bg-no-repeat pl-6 mb-1.5'>{t('subscriptions_citizen_is_member')}</li>} */}
                </ul>

                <p className=''>{t('subscriptions_citizen_report_mistake')} <a className='text-primary' href='mailto:space@traditionaldreamfactory.com'>space@traditionaldreamfactory.com</a></p>


                <div></div>
              </div>
            ) : (
              <>
                {' '}
                <Input
                  label={t('subscriptions_citizen_good_why')}
                  value={application?.why || ''}
                  onChange={(e) => updateApplication('why', e.target.value)}
                  placeholder={t('generic_input_placeholder')}
                />
                <p>{t('subscriptions_citizen_good_how')}</p>
                <div className="space-y-2">
                  <div className="flex">
                    <Checkbox
                      id="iOwnTokens"
                      isChecked={application?.iOwnTokens || false}
                      onChange={() =>
                        updateApplication(
                          'iOwnTokens',
                          !application?.iOwnTokens,
                        )
                      }
                    />
                    <label htmlFor="iOwnTokens">
                      {t('subscriptions_citizen_i_own_tokens')}
                    </label>
                  </div>
                  <div className="flex">
                    <Checkbox
                      id="iWantToFinanceTokens"
                      isChecked={application?.iWantToFinanceTokens || false}
                      onChange={() =>
                        updateApplication(
                          'iWantToFinanceTokens',
                          !application?.iWantToFinanceTokens,
                        )
                      }
                    />
                    <label htmlFor="iWantToFinanceTokens">
                      {t('subscriptions_citizen_i_want_to_finance_tokens')}
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {isWalletEnabled && (
            <div className="my-8">
              <Wallet />
            </div>
          )}

          <Button
            isEnabled={Boolean(
              application?.why &&
                (application?.iOwnTokens || application?.iWantToFinanceTokens),
            )}
            className="booking-btn"
            onClick={handleNext}
          >
            {getCtaButtonText()}
          </Button>
        </main>
      </div>
    </>
  );
};

ValidationCitizenPage.getInitialProps = async (context: NextPageContext) => {
  try {
    const [subscriptionsRes, generalRes, messages] = await Promise.all([
      api.get('/config/subscriptions').catch(() => {
        return null;
      }),

      api.get('/config/general').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const subscriptionsConfig = subscriptionsRes?.data?.results?.value;

    const generalConfig = generalRes?.data?.results?.value;
    return {
      subscriptionsConfig,

      generalConfig,
      messages,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: { enabled: false, elements: [] },

      generalConfig: null,
      error: parseMessageFromError(err),
      messages: null,
    };
  }
};

export default ValidationCitizenPage;
