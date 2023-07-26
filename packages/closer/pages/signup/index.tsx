import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import ApplicationForm from '../../components/ApplicationForm';
import SignupForm from '../../components/SignupForm';
import { Card } from '../../components/ui';
import Heading from '../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { SubscriptionPlan } from '../../types/subscriptions';
import api, { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';

interface Props {
  subscriptionPlans: SubscriptionPlan[];
}

const Signup = ({ subscriptionPlans }: Props) => {
  const [referrerName, setReferrerName] = useState<null | string>(null);
  const [referrerPhoto, setReferrerPhoto] = useState<null | string>(null);
  const defaultSubscriptionPlan = subscriptionPlans.find(
    (plan: SubscriptionPlan) => plan.priceId === 'free',
  );
  const router = useRouter();
  const { referral } = router.query || {};

  useEffect(() => {
    let referredBy = null;
    if (referral) {
      referredBy = referral;
    } else {
      referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
    }

    if (referredBy) {
      (async function getReferrer() {
        try {
          const res = await api.get(`/user/${referredBy}`);
          const referrer = res.data.results;
          if (referrer) {
            const referrerPhotoUrl = referrer.photo
              ? `${cdn}${referrer.photo}-profile-sm.jpg`
              : null;
            setReferrerName(referrer.screenname);
            setReferrerPhoto(referrerPhotoUrl);
          }
        } catch (error) {}
      })();
    }
  }, [router.query]);

  return (
    <>
      <Head>
        <title>{__('signup_title')}</title>
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
                {__('signup_title')}
              </Heading>

              <div>
                <Heading level={4} className="mb-4 text-sm uppercase">
                  {defaultSubscriptionPlan?.description}
                </Heading>
                <ul className="mb-4">
                  {defaultSubscriptionPlan?.perks.map((perk) => {
                    return (
                      <li
                        key={perk}
                        className="bg-[length:16px_16px] bg-[center_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5"
                      >
                        <span className="block">
                          {perk.includes('<') ? (
                            <span dangerouslySetInnerHTML={{ __html: perk }} />
                          ) : (
                            perk
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {referrerName && (
                  <div className="flex items-center gap-4 ">
                    {__('signup_form_referrer')}{' '}
                    <Card className="bg-accent-light py-2">
                      <div className="flex items-center gap-2">
                        {referrerPhoto ? (
                          <Image
                            src={referrerPhoto}
                            alt={referrerName}
                            width={30}
                            height={30}
                            className="rounded-full"
                          />
                        ) : (
                          <FaUser className="text-success w-[3opx] h-[30px] " />
                        )}
                        <span>{referrerName}</span>
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              <div>
                {__('signup_form_get_credits')}{' '}
                <Link
                  className="text-accent font-bold underline"
                  href="/settings/credits"
                >
                  {__('signup_form_credit_learn_more')}
                </Link>
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
      subscriptionPlans: subscriptions.value.plans,
    };
  } catch (err: unknown) {
    return {
      subscriptionPlans: [],
      error: parseMessageFromError(err),
    };
  }
};

export default Signup;
