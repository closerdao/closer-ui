import Head from 'next/head';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import SubscribeCheckoutForm from '../../components/SubscribeCheckoutForm';

import { NextPage } from 'next';

import { useConfig } from '../../hooks/useConfig';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

const now = new Date();

const SubscribeCheckout: NextPage = () => {
  const { PERMISSIONS, PLATFORM_NAME } = useConfig() || {};
  // const { user } = useAuth();

  // TODO: do we need to store the unfinished subscription status in db?
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
            <h1 className="mb-4">Checkout</h1>
            <div className="grid gap-4 m-auto">
              <Elements stripe={stripePromise}>
                <SubscribeCheckoutForm />
              </Elements>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscribeCheckout;
