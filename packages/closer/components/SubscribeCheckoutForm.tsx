import { useEffect, useState } from 'react';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

import api from '../utils/api';

const user = {
  screenname: 'VV',
  timezone: 'Asia/Almaty',
  slug: 'vv',
  tagline: '',
  about: 'srwer',
  email: 'vashnev13@gmail.com',
  email_verified: false,
  lastactive: '2023-03-23T10:08:36.178Z',
  lastlogin: '2023-03-24T07:03:00.985Z',
  roles: [],
  viewChannels: [],
  manageChannels: [],
  location: {
    type: 'Point',
    coordinates: [76.9167, 43.25],
    timezone: 'Asia/Almaty',
    source: 'IP',
    iso_code: '',
    name_long: 'Almaty, ',
    name: 'Almaty',
  },
  settings: { newsletter_weekly: true },
  links: [],
  visibleBy: [],
  createdBy: null,
  updated: '2023-03-23T13:08:36.649Z',
  created: '2023-03-23T10:08:36.178Z',
  attributes: [],
  managedBy: [],
  _id: '641c2524f72ea12f5e9ab85d',
};

function SubscribeCheckoutForm() {
  const [email, setEmail] = useState('');
  const [priceId, setPriceId] = useState('');
  const [error, setError] = useState(null);
  const [submitDisabled, setSubmitDisabled] = useState(true);

  const stripe = useStripe();
  const elements = useElements();

  const validateCardElement = async (event: any) => {
    // Listen for changes in the CardElement
    // and display any errors as the customer types their card details
    if (event.empty || event.error) {
      setSubmitDisabled(true);
    } else {
      setSubmitDisabled(false);
    }
    if (!error) {
      setError(event.error ? event.error.message : '');
    }
  };

  useEffect(() => {
    setPriceId('price_1MqtoHGtt5D0VKR2Has7KE5X');
    setEmail(user.email);
  }, []);

  const createSubscription = async (e: any) => {
    e.preventDefault;
    try {
      const paymentMethod = await stripe?.createPaymentMethod({
        type: 'card',
        card: elements?.getElement(CardElement)!,
        billing_details: {
          email,
        },
      });
      //

      //     const { err, paymentMethod } = await stripe?.createPaymentMethod({
      //     type: 'card',
      //     card: elements?.getElement(CardElement)!,
      //     billing_details: {
      //       email,
      //     },
      //   });
      //     console.log('paymentMethod', paymentMethod);

      //     if (err) {
      //         console.log('Payment failed:', error);
      //       } else {
      //         console.log('Payment successful:', paymentMethod);
      //       }

      //

      // call the backend to create subscription
      console.log('data=', paymentMethod?.paymentMethod?.id, priceId, email);

      const response = await api.post('/subscription', {
        email,
        paymentMethod: paymentMethod?.paymentMethod?.id,
        // paymentMethod: 'pm_1MrcqFGtt5D0VKR2GUwCfbCT',
        priceId,
      });

      console.log('response=', response.data);

      //   const confirmPayment = await stripe?.confirmCardPayment(
      //     response.clientSecret,
      //   );

      //   if (confirmPayment?.error) {
      //     console.log('Error! ', confirmPayment.error.message);
      //   } else {
      //     console.log('Success! ');
      //   }
    } catch (error) {
      console.log('error=', error);
    }
  };

  return (
    <div className="grid gap-4 m-auto w-[400px]">
      <input
        placeholder="Email"
        type="text"
        value={user.email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <CardElement
        onChange={validateCardElement}
        className="w-full h-14 rounded-2xl bg-background border border-neutral-200 px-4 py-4"
      />
      <button onClick={createSubscription} disabled={!stripe || submitDisabled}>
        Subscribe
      </button>
    </div>
  );
}

export default SubscribeCheckoutForm;
