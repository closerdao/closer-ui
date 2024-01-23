import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';
import { Card, ErrorMessage } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import { SubscriptionPlan } from '../../types/subscriptions';
import api, { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';
import { prepareSubscriptions } from '../../utils/subscriptions.helpers';

interface Props {
  subscriptionsConfig: { enabled: boolean; plans: SubscriptionPlan[] };
}

const Signup = ({ subscriptionsConfig }: Props) => {
  const subscriptionPlans = prepareSubscriptions(subscriptionsConfig);
  const config = useConfig();
  const { APP_NAME } = config || {};

  const { platform }: any = usePlatform();

  const [error, setError] = useState(false);

  const defaultSubscriptionPlan = subscriptionPlans && subscriptionPlans.find(
    (plan: SubscriptionPlan) => plan.priceId === 'free',
  );

  const router = useRouter();
  const { referral } = router.query || {};

  let referredBy: null | string = null;

  if (typeof window !== 'undefined') {
    if (referral) {
      referredBy = referral as string;
    } else {
      referredBy = localStorage.getItem(
        REFERRAL_ID_LOCAL_STORAGE_KEY,
      ) as string;
    }
  }
  const referrer = platform?.user.findOne(referredBy);

  const loadData = async () => {
    try {
      await platform.user.getOne(referredBy);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Head>
        <title>{__('signup_title', APP_NAME)}</title>
      </Head>
      <main className="main-content mt-12 px-4 max-w-4xl mx-auto">
        
        {process.env.NEXT_PUBLIC_REGISTRATION_MODE === 'curated' ? (
          <ApplicationForm />
        ) : (
          <div className="flex flex-col md:flex-row gap-6 md:mt-[200px] mt-0">
            <div className="flex flex-col gap-10 w-full md:w-1/2">
              <Heading
                level={1}
                className="uppercase text-5xl sm:text-6xl font-extrabold"
              >
                {__('signup_title', APP_NAME)}
              </Heading>

              <div>
                {process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true' && (
                  <>
                    <Heading level={4} className="mb-4 text-sm uppercase">
                      {defaultSubscriptionPlan?.description}
                    </Heading>
                    <ul className="mb-4">
                      {defaultSubscriptionPlan?.perks.split(',').map((perk) => {
                        return (
                          <li
                            key={perk}
                            className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                          >
                            <span className="block">
                              {perk.includes('<') ? (
                                <span
                                  dangerouslySetInnerHTML={{ __html: perk }}
                                />
                              ) : (
                                perk
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {error && <ErrorMessage error={error} />}

                {referrer && (
                  <div>
                    <div className="flex items-center gap-4 ">
                      {__('signup_form_referrer')}{' '}
                      <Card className="bg-accent-light py-2">
                        <div className="flex items-center gap-2">
                          {referrer ? (
                            <Image
                              src={
                                referrer &&
                                `${cdn}${referrer.get('photo')}-profile-sm.jpg`
                              }
                              alt={''}
                              width={30}
                              height={30}
                              className="rounded-full"
                            />
                          ) : (
                            <FaUser className="text-success w-[3opx] h-[30px] " />
                          )}
                          <span>{referrer.get('screenname')}</span>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <SignupForm />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

Signup.getInitialProps = async () => {
  try {
    const {
      data: { results: subscriptions },
    } = await api.get('/config/subscriptions');

    return {
      subscriptionsConfig: subscriptions.value,
    };
  } catch (err: unknown) {
    return {
      subscriptionsConfig: [],
      error: parseMessageFromError(err),
    };
  }
};

export default Signup;
