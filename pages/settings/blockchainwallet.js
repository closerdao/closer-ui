import Head from 'next/head';

import React, { useRef, useState } from 'react';

import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';

import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, utils } from 'ethers';
import useSWR from 'swr';

import PageNotAllowed from '../401';
import '../../config';
import {
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_DAO_TOKEN_ABI,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_NATIVE_TOKEN,
  BLOCKCHAIN_NETWORK_ID,
} from '../../config_blockchain';
import { useAuth } from '../../contexts/auth';
import {
  fetcher,
  formatBigNumberForDisplay,
  sendDAOToken,
} from '../../utils/blockchain';
import { __ } from '../../utils/helpers';

const CryptoWallet = () => {
  const { isAuthenticated } = useAuth();
  const { chainId, account, library } =
    useWeb3React();

  const [toAddress, setToAddress] = useState('');
  const [amountToSend, setamountToSend] = useState(0);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [lockedStakeAt, setLockedStakeAt] = useState();
  const [unlockedStakeAt, setUnlockedStakeAt] = useState();

  const yearRef = useRef(null)
  const dayRef = useRef(null)

  const { data: nativeBalance, mutate: mutateNB } = useSWR(
    ['getBalance', account, 'latest'],
    {
      fetcher: fetcher(library),
    },
  );

  const { data: DAOTokenBalance, mutate: mutateDTD } = useSWR( 
    [BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI),
    },
  );

  const { data: lockedStake, mutate: mutateLS } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'lockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: unlockedStake, mutate: mutateUS } = useSWR(
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'unlockedStake', account],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
      fallbackData: BigNumber.from(0),
    },
  );

  const { data: bookedDates2022, mutate: mutate2022 } = useSWR( 
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationBookings', account, 2022],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  const { data: bookedDates2023, mutate: mutate2023 } = useSWR( 
    [BLOCKCHAIN_DAO_DIAMOND_ADDRESS, 'getAccommodationBookings', account, 2023],
    {
      fetcher: fetcher(library, BLOCKCHAIN_DIAMOND_ABI),
    },
  );

  const stakesAt = async (year,day) => {
    if (chainId !== BLOCKCHAIN_NETWORK_ID) {
      return;
    }

    try {
      const Diamond = new Contract(
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
        BLOCKCHAIN_DIAMOND_ABI,
        library.getSigner(),
      );
    
      setUnlockedStakeAt(await Diamond.unlockedStakeAt(
        account,year,day
      )); 
      setLockedStakeAt(await Diamond.lockedStakeAt(
        account,year,day
      ));   

    } catch (error) {}
  };

  const sendTokenTransaction = async () => {
    if (chainId !== BLOCKCHAIN_NETWORK_ID) {
      return;
    }

    if (!toAddress || !library) {
      alert('A Celo address to send Tokens to is required.');
      return;
    }

    try {
      const tx = await sendDAOToken(
        library,
        toAddress,
        BigNumber.from(amountToSend),
      );

      setPendingTransactions([...pendingTransactions, tx.hash]);
      await tx.wait();
      mutateDTD(undefined, true);
      console.log(`${tx.hash} mined`);
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx.hash),
      );
    } catch (error) {}
  };

  const sendCeloTransaction = async () => {
    if (!toAddress || !library) {
      alert('A Celo address to send CELO to is required.');
      return;
    }

    const signer = library.getSigner();
    try {
      const tx = await signer.sendTransaction({
        to: utils.getAddress(toAddress),
        value: BigNumber.from(amountToSend),
      });

      setPendingTransactions([...pendingTransactions, tx.hash]);
      await tx.wait();
      mutateNB(undefined, true);
      console.log(`${tx.hash} mined`);
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx.hash),
      );
    } catch (error) {}
  };

  const cancelBooking = async (year,day) => {
    if (chainId !== BLOCKCHAIN_NETWORK_ID) {
      return;
    }

    try {
      const Diamond = new Contract(
        BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
        BLOCKCHAIN_DIAMOND_ABI,
        library.getSigner(),
      );

      console.log('here')
    
      const tx = await Diamond.cancelAccommodation(
        [[year,day]]
      );    


      setPendingTransactions([...pendingTransactions, tx.hash]);
      await tx.wait();
      mutateLS(undefined, true);
      mutateUS(undefined, true);
      mutate2022(undefined, true);
      mutate2023(undefined, true);
      console.log(`${tx.hash} mined`);
      setPendingTransactions((pendingTransactions) =>
        pendingTransactions.filter((h) => h !== tx.hash),
      );
    } catch (error) {}
  };

  

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{__('blockchainwallet_title')}</title>
      </Head>
      {pendingTransactions?.length > 0 && <Spinner fixed className='inset-1/2' />}
      <div className="main-content min-h-[300px]">
        <main className="flex flex-col justify-between md:max-w-[60%]">
          <div className="flex flex-row items-baseline">
            <h2 className="mt-9 mb-8 text-4xl font-light">
              {__('blockchain_wallet')}
            </h2>
            {account && library && (
              <>
                <span className="px-4">
                  ({BLOCKCHAIN_NATIVE_TOKEN.name}) - (
                  {account?.substring(0, 4) +
                    '...' +
                    account?.substring(account?.length - 4)}
                  )
                </span>
              </>
            )}
          </div>
          {!account && library && (
            <button
              className="btn-primary w-48 px-4"
              onClick={() => {
                alert('Not implemented')
              }}
            >
              {__('blockchain_connect_wallet')}
            </button>
          )}
          {account && library && (
            <>
              <h2>Wallet contents</h2>
              <div className="flex justify-between md:flex-row m-4">
                <label>Sending params:</label>
                <input
                  className="w-64"
                  type="text"
                  value={toAddress}
                  placeholder="Address"
                  onChange={(e) => setToAddress(e.target.value)}
                />
                <input
                  className="w-32"
                  type="number"
                  value={amountToSend}
                  placeholder="Celo amount"
                  onChange={(e) => setamountToSend(e.target.value)}
                />
              </div>

              {nativeBalance && (
                <div className="m-2">
                  {formatBigNumberForDisplay(
                    nativeBalance,
                    BLOCKCHAIN_NATIVE_TOKEN.decimals,
                    2,
                  )}{' '}
                  {BLOCKCHAIN_NATIVE_TOKEN.symbol}
                  <button
                    className="btn-primary w-48 m-2"
                    onClick={async () => {
                      sendCeloTransaction();
                    }}
                  >
                    Send CELO
                  </button>
                </div>
              )}

              {DAOTokenBalance && (
                <div className="m-2">
                  {formatBigNumberForDisplay(
                    DAOTokenBalance,
                    BLOCKCHAIN_DAO_TOKEN['decimals'],
                  )}{' '}
                  {BLOCKCHAIN_DAO_TOKEN.symbol}
                  <button
                    className="btn-primary w-48 m-2"
                    onClick={async () => {
                      sendTokenTransaction();
                    }}
                  >
                    Send {BLOCKCHAIN_DAO_TOKEN.name}
                  </button>
                </div>
              )}

              <h2>
                Bookings and Stake
              </h2>

              <h3>Stakes now</h3>
              <b>
                Locked: {formatBigNumberForDisplay(lockedStake, 18)}
              </b>
              <b>
                Unlocked: {formatBigNumberForDisplay(unlockedStake, 18)}
              </b>
              <br/>
              <h3>Simulate Stakes at a date</h3>
              <div className='flex flex-row'>
              Year: <input 
                    className='w-12'
                    ref={yearRef}
                    type="text"
                    id="year"
                    name="year"/> 
              Day_of_year: <input 
                    className='w-12'
                    ref={dayRef}
                    type="text"
                    id="day"
                    name="day"/> 
                    <button className='border-4 border-black' onClick={() => {
                      stakesAt(yearRef.current.value, dayRef.current.value)
                    }}>Fetch</button>
              </div>
              <b>
                Locked: {formatBigNumberForDisplay(lockedStakeAt, 18)}
              </b>
              <b>
                Unlocked: {formatBigNumberForDisplay(unlockedStakeAt, 18)}
              </b>
              <br/>

              { bookedDates2022 && (
                <>
                <b>Booked dates for 2022:</b>
                
                { bookedDates2022.map( e => (
                  <div key={'p'+e[1]+e[2]}>
                    {new Date(2022, 0, e[2]).toLocaleDateString('en-US')} - Price: {formatBigNumberForDisplay(e[3],18)}
                    <button  onClick={() => {
                      cancelBooking(2022,e[2]);
                    }}>
                      Cancel
                    </button>
                  </div>
                 ))
                }
              </>
              )}
              <br/>
              { bookedDates2023 && (
                <>
                <b>Booked dates for 2023:</b>
                
                { bookedDates2023.map( e => (
                  <div key={'p'+e[1]+e[2]}>
                    {new Date(2023, 0, e[2]).toLocaleDateString('en-US')} - Price: {formatBigNumberForDisplay(e[3],18)}
                    <button onClick={async () => {
                      cancelBooking(2023,e[2]);
                    }}>
                      Cancel
                    </button>
                  </div>
                 ))
                }
              </>
              )}

              

              
            </>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default CryptoWallet;
