import Head from "next/head";

import { NextPage } from 'next';

import { useAuth } from '../../contexts/auth';
import { useConfig } from '../../hooks/useConfig';
import { Router, useRouter } from 'next/router';

const now = new Date();

const Subscribe: NextPage = () => {
  const { PERMISSIONS, PLATFORM_NAME } = useConfig() || {};
  const { user } = useAuth();
  const router = useRouter();

  const subscriptions = [
    {
      title: 'Free',
      description: "Free plan description",
      priceID: 'stripe price id',
      tier: 1,
      monthlyCredits: 100,
      price: 'free',
      perks: ['perk1', 'perk 2'],
      billingPeriod: 'month',
    },
    {
      title: 'Plan 2',
      description: "Plan 2 description",
      priceID: 'stripe price id',
      tier: 1,
      monthlyCredits: 100,
      price: '10',
      perks: ['perk1', 'perk 2'],
      billingPeriod: 'month',
    },
  ];

  return (
    <>
      <Head>
        <title>
          {/* {PLATFORM_NAME} {__('events_title')} */}
          {PLATFORM_NAME} Subscriptions
        </title>
      </Head>
      <div className="main-content w-full"></div>
      <div className="main-content intro">
        <div className="page-title flex justify-between">
          {/* <h1 className="mb-4">{__('events_past')}</h1> */}
          <div>
            <h1 className="mb-4">Subscriptions</h1>
            {subscriptions &&
              subscriptions.map((subscription) => (
                <div key={subscription.title} className="border p-6 mb-4">
                  <h2>{subscription.title}</h2>
                  <div>
                    {subscription.perks.map((perk) => {
                      return <p key={perk}>{perk}</p>;
                    })}
                  </div>
                  <button className='border p-4' onClick={()=>router.push("/subscribe/checkout")}>Subscribe</button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

// export async function getStaticProps() {
//   const res = await fetch('')
//   const subscriptions = await res.json()

//   return {
//     props: {
//       subscriptions,
//     },
//   }
// }

export default Subscribe;
