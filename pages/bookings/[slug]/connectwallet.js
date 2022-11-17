import Head from 'next/head';
import { useRouter } from 'next/router';

import React, { useEffect } from 'react';

import Layout from '../../../components/Layout';

import { useWeb3React } from '@web3-react/core';

import { BLOCKCHAIN_NETWORK_ID } from '../../../config_blockchain';
import { __ } from '../../../utils/helpers';

const Booking = ({ booking, error }) => {
  const router = useRouter();
  const { onboard, switchNetwork } = {};
  const { chainId, account, activate, deactivate, setError, active, library } =
    useWeb3React();

  useEffect(() => {
    account &&
      chainId === BLOCKCHAIN_NETWORK_ID &&
      router.push(`/bookings/${booking}/checkout`);
  }, [account, chainId]);

  return (
    <Layout>
      <Head>
        <title>{__('blockchain_interstitial_title')}</title>
      </Head>
      <main className="main-content max-w-prose booking min-h-[200px]">
        <h1>{__('blockchain_interstitial_big_title')}</h1>
        <p>{__('blockchain_interstitial_subtitle')}</p>

        <button
          className="btn-primary mt-3"
          onClick={() => router.push(`/bookings/${booking}/checkout`)}
        >
          {__('blockchain_bypass_wallet')}
        </button>
      </main>
    </Layout>
  );
};

Booking.getInitialProps = async ({ req, query }) => {
  try {
    return { booking: query.slug };
  } catch (err) {
    console.log('Error', err.message);

    return {
      error: err.message,
    };
  }
};

export default Booking;
