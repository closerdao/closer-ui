import Head from 'next/head';

import { useConfig } from '@/../../packages/closer';
import { __ } from '@/../../packages/closer/utils/helpers';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import SubscribeCheckoutForm from '@/../../packages/closer/components/SubscribeCheckoutForm';
import BackButton from '@/../../packages/closer/components/ui/BackButton';
import Heading from '@/../../packages/closer/components/ui/Heading';
import ProgressBar from '@/../../packages/closer/components/ui/ProgressBar';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY as string,
);

const Checkout = () => {

  // code used to redirect from login page:
  // const router = useRouter();
  // if (router.query?.back) {
  //   const redirectBack = router.query?.back
  //     ? decodeURIComponent(router.query?.back)
  //     : '/';
  // }
  // const { isAuthenticated, login, setAuthentification, error, setError } =
  //   useAuth();

  // if (isAuthenticated) {
  //   router.push(redirectBack);
  // }
  //

  const { PLATFORM_NAME } = useConfig() || {};

  return (
    <>
      <Head>
        <title>
          {__('subscriptions_checkout_title')} — {__('subscriptions_title')} —{' '}
          {PLATFORM_NAME}
        </title>
      </Head>

      <div className="main-content w-full max-w-screen-sm mx-auto">
        <BackButton clickHandler={() => null}>{__('buttons_back')}</BackButton>

        <Heading level={1}>
          <span className="mr-1">💰</span>
          <span>{__('subscriptions_checkout_title')}</span>
        </Heading>

        <ProgressBar />
        {/* <div className="mt-16 flex flex-col gap-16 "> */}
        <div className="mt-16 flex gap-8 w-full flex-col md:flex-row">
          <Elements stripe={stripePromise}>
            <SubscribeCheckoutForm />
          </Elements>
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

export default Checkout;
