import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import React, { useEffect, useState } from 'react';
import ReactTooltip from 'react-tooltip';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import CheckoutForm from '../../../components/CheckoutForm';
import Layout from '../../../components/Layout';
import Spinner from '../../../components/Spinner';

import { useWeb3React } from '@web3-react/core';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { BigNumber, Contract } from 'ethers';
import useSWR from 'swr';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import config from '../../../config';
import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NETWORK_ID,
} from '../../../config_blockchain';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import api from '../../../utils/api';
import { fetcher, formatBigNumberForDisplay } from '../../../utils/blockchain';
import { __, priceFormat } from '../../../utils/helpers';

dayjs.extend(LocalizedFormat);
dayjs.extend(dayOfYear);

const Booking = ({ booking, error }) => {
  console.log(booking)
  const router = useRouter();
  const [editBooking, setBooking] = useState(booking);
  const stripe = loadStripe(config.STRIPE_PUB_KEY);
  const { isAuthenticated, user } = useAuth();
  const { platform } = usePlatform();

  const { account, library, chainId } = useWeb3React();
  const [pendingTransactions, setPendingTransactions] = useState([]); //In general the following pendingTransactions state should be moved to the root of the app, and should be used as a dependency by all hooks that read blockchain state
  const [nightsBookedOnchain, setNightsBookedOnchain] = useState(false);

  const processConfirmation = async (update) => {
    try {
      const {
        data: { results: payment },
      } = await api.post('/bookings/payment', {
        type: 'booking',
        _id: booking._id,
        email: user.email,
        name: user.screenname,
        message: booking.message,
        volunteer: booking.volunteer,
      });
      router.push(`/bookings/${booking._id}`);
    } catch (err) {
      alert('An error occured.');
      console.log(err);
    }
  };

  
//Start blockchain interactions
  const start = dayjs(booking.start);
  const end = dayjs(booking.end);
  const bookingYear = start.year();
  let nights = [[bookingYear, dayjs(booking.start).dayOfYear()]];
  for (var i = 1; i < booking.duration; i++) {
    nights = [
      ...nights,
      [bookingYear, dayjs(booking.start).add(i, 'day').dayOfYear()],
    ];
  }

  const { data: balanceDAOToken, mutate: mutateBD } = useSWR(
    [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
    },
  );

  const { data: balanceLocked, mutate: mutateStakedBalance } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'lockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  const { data: bookedNights, mutate: mutateBookedNights } = useSWR(
    [
      BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      'getAccommodationBookings',
      account,
      bookingYear,
    ],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  //This checks whether the current wallet has staked tokens for the booking he's looking at.
  useEffect(() => {
    if (!bookedNights) {
      return;
    }

    var all_nights_staked = true

    for (var i = 0; i < nights.length; i++) {
      all_nights_staked = all_nights_staked && bookedNights.some((e) => e.year == nights[i][0] && e.dayOfYear == nights[i][1])
    }
    setNightsBookedOnchain(all_nights_staked);
  }, [
    pendingTransactions,
    account,
    bookedNights
  ]);

  if (start.year() != end.year()) {
    //It's way more complicated to do cross-year bookings on the blockchain
    return <div>You cannot yet book accross different years</div>;
  }


  const bookAccomodationOnchain = async () => {
    //The following doesn't work anymore and should be moved to a blockchain read whenit's 
    // if (!canUseTokens) {
    //   throw new Error('User does not have enough tokens to continue');
    // }
    if (!library || !account) {
      return;
    }

    if(BLOCKCHAIN_NETWORK_ID != chainId){
      return;  
    }

    const DAOTokenContract = new Contract(
      BLOCKCHAIN_DAO_TOKEN.address,
      BLOCKCHAIN_DAO_TOKEN_ABI,
      library.getUncheckedSigner(),
    );

    const Diamond = new Contract(
      BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
      BLOCKCHAIN_DIAMOND_ABI,
      library.getUncheckedSigner(),
    );


    //Now we can book the nights
    try {
      const tx3 = await Diamond.bookAccommodation(nights, 1);
      setPendingTransactions([...pendingTransactions, tx3.hash]);
      await tx3.wait();
      console.log(`${tx3.hash} mined`);
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx3.hash),
      );
      setBooking({ ...booking, transactionId: tx3.hash });
      mutateStakedBalance()
      mutateBookedNights()
    } catch (error) {
      //User rejected transaction
      return;
    }
  };

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }
  if (!booking) {
    return <PageNotFound />;
  }

  return (
    <Layout>
      <ReactTooltip />
      <Head>
        <title>{booking.name}</title>
        <meta name="description" content={booking.description} />
        <meta property="og:type" content="booking" />
      </Head>

      <main className="main-content max-w-prose booking">
            <h1 className="mb-4">{__('bookings_checkout_title')}</h1>
            <section className="mt-3">
              <h3>{__('bookings_summary')}</h3>
              <p>
                {__('bookings_checkin')} <b>{start.format('LLL')}</b>
              </p>
              <p>
                {__('bookings_checkout')} <b>{end.format('LLL')}</b>
              </p>
              <p>--</p>
              <p>
                {__('bookings_utility_fee')}
                <b>
                  {' '}
                  {priceFormat(booking.utilityFiat)}
                </b>
              </p>
              { booking.useTokens ?
                <p>
                  {__('bookings_tokens_lock')}
                  <b>
                    {' '}
                    {priceFormat(booking.rentalToken)}
                  </b>
                </p>:
                <p>
                  {__('bookings_rental_cost')}
                  <b>
                    {' '}
                    {priceFormat(booking.rentalFiat)}
                  </b>
                </p>
              }
              <p>--</p>
              <p>
                {__('bookings_total')}
                <b>
                  {' '}
                  {priceFormat(booking.utilityFiat && booking.utilityFiat.val + (booking.useTokens || !booking.rentalFiat ? 0 : booking.rentalFiat.val))}
                </b>
              </p>
            </section>
            {booking.status === 'open' && (
              <div className="mt-2">
                {account ? 
                (
                  <>
                  {/* Book using crypto ==> Should add an additional condition above this thing for if the user has actively selected crypto */}
                    <section>
                        <section className='flex flex-col items-start'>
                          <p>
                            Staked tokens for nights are locked for one year. 
                          </p>
                          { BLOCKCHAIN_NETWORK_ID != chainId ? 
                            (
                              <div
                              className='rounded-full p-2 border-red-700 border-2 text-red-800'>
                                You are on the wrong chain, switch chain
                              </div>
                            ):
                            ( nightsBookedOnchain ? 
                              (
                              <div
                              className='rounded-full p-2 border-green-700 border-2 text-green-700'>
                                Your nights have been reserved with your tokens
                              </div>
                              ) : 
                              (
                              <button
                                className="btn-primary px-4"
                                disabled={pendingTransactions.length>0}
                                onClick={async () => {
                                  bookAccomodationOnchain();
                                }}
                              >
                                {pendingTransactions.length>0 ? (
                                  <div className="flex flex-row items-center">
                                    <Spinner />
                                    <p className="font-x-small ml-4 text-neutral-300">
                                      Wait for transaction validation
                                    </p>
                                  </div>
                                ) : (
                                  'Lock tokens for booking'
                                )}
                              </button>
                              )
                            )
                          }
                        </section>
                      
                    </section>
                  </>
                ) : (
                  <>
                    {booking.volunteer ? (
                      <div>
                        <p>{__('booking_volunteering_details')}</p>
                        <p className="mt-3">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              processConfirmation();
                            }}
                            className="btn-primary"
                          >
                            Confirm booking
                          </a>
                        </p>
                      </div>
                    ) : (
                      <>
                        <Elements stripe={stripe}>
                          <CheckoutForm
                            type="booking"
                            _id={booking._id}
                            onSuccess={(payment) => {
                              setBooking({
                                ...booking,
                                status: 'confirmed',
                              });
                              router.push(`/bookings/${booking._id}`);
                            }}
                            email={user.email}
                            name={user.screenname}
                            message={booking.message}
                            cancelUrl={`/bookings/${booking._id}/contribution`}
                            buttonText={
                              user.roles.includes('member')
                                ? 'Book'
                                : 'Request to book'
                            }
                            buttonDisabled={false}
                          />
                        </Elements>
                      </>
                    )}
                  </>
                )}
                {user.roles.includes('member') ? (
                  <p className="mt-3 text-sm">
                    <i>{__('booking_cancelation_policy_member')}</i>
                  </p>
                ) : (
                  <p className="mt-3 text-sm">
                    <i>{__('booking_cancelation_policy')}</i>
                  </p>
                )}
              </div>
            )}
      </main>
    </Layout>
  );
};

Booking.getInitialProps = async ({ req, query }) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);
    return { booking };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Booking;
