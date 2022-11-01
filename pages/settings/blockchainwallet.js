import React, { useState } from 'react';
import Head from 'next/head';
import useSWR from 'swr';
import { utils, BigNumber } from 'ethers';
import { useWeb3React } from '@web3-react/core';


import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';

import { useAuth } from '../../contexts/auth'
import { __ } from '../../utils/helpers';

import PageNotAllowed from '../401';

import {  } from '../../config';
import { BLOCKCHAIN_NETWORK_ID, BLOCKCHAIN_NATIVE_TOKEN, BLOCKCHAIN_DAO_TOKEN, BLOCKCHAIN_DAO_TOKEN_ABI } from '../../config_blockchain';
import { formatBigNumberForDisplay, fetcher, sendDAOToken } from '../../utils/blockchain';


const CryptoWallet = () => {
  const { isAuthenticated } = useAuth();
  const { chainId, account, activate, deactivate, setError, active, library } = useWeb3React()

  const [toAddress, setToAddress] = useState('')
  const [amountToSend, setamountToSend] = useState(0)
  const [pendingTransactions, setPendingTransactions] = useState([])

  const { data: nativeBalance, mutate: mutateNB } = useSWR(['getBalance', account, 'latest'], {
    fetcher: fetcher(library)
  })
  
  const { data: DAOTokenBalance, mutate: mutateDTD } = useSWR([BLOCKCHAIN_DAO_TOKEN.address, 'balanceOf', account], {
    fetcher: fetcher(library, BLOCKCHAIN_DAO_TOKEN_ABI)
  })

  const sendTokenTransaction = async () => {
    if(chainId !== BLOCKCHAIN_NETWORK_ID){
      return
    }

    if (!toAddress || !library) {
      alert('A Celo address to send Tokens to is required.')
      return
    }

    try {
      const tx = await sendDAOToken(library, toAddress, BigNumber.from(amountToSend));
    
      setPendingTransactions([...pendingTransactions, tx.hash])
      await tx.wait();
      mutateDTD(undefined, true)
      console.log(`${tx.hash} mined`)
      setPendingTransactions((pendingTransactions) => pendingTransactions.filter((h) => h !== tx.hash));
    } catch (error) {
      
    }
  }

  const sendCeloTransaction = async () => {
    if (!toAddress || !library) {
      alert('A Celo address to send CELO to is required.')
      return
    }

    const signer = library.getSigner()
    try {
      const tx = await signer.sendTransaction({
        to: utils.getAddress(toAddress),
        value: BigNumber.from(amountToSend)
      })

      setPendingTransactions([...pendingTransactions, tx.hash])
      await tx.wait();
      mutateNB(undefined, true)
      console.log(`${tx.hash} mined`)
      setPendingTransactions((pendingTransactions) => pendingTransactions.filter((h) => h !== tx.hash));
    } catch (error) {
  
    } 
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  return (
    <Layout protect>
      <Head>
        <title>{ __('blockchainwallet_title') }</title>
      </Head>
      {pendingTransactions?.length > 0 && <Spinner fixed />}
      <div className='main-content min-h-[300px]'>
        <main className="flex flex-col justify-between md:max-w-[60%]">
          <div className='flex flex-row items-baseline'>
            <h3 className="mt-9 mb-8 text-4xl font-light">{__('blockchain_wallet')}</h3>
            {account && library &&
              <>
                <span className='px-4'>
              ({BLOCKCHAIN_NATIVE_TOKEN.name}) - ({account?.substring(0, 4) + '...' + account?.substring(account?.length - 4)})
                </span>
              </>
            }
          </div>
          {!account && library &&
          <button
            className="btn-primary w-48 px-4"
            onClick={() => {
              onboard?.walletSelect();
            } }
          >
            {__('blockchain_connect_wallet')}
          </button>}
          {account && library && (
            <>
              <h4>Wallet contents</h4>
              <div className="flex justify-between md:flex-row m-4">
                <label>Sending params:</label>
                <input
                  className="w-64"
                  type="text"
                  value={toAddress}
                  placeholder="Address"
                  onChange={e => setToAddress(e.target.value)} />
                <input
                  className="w-32"
                  type="number"
                  value={amountToSend}
                  placeholder="Celo amount"
                  onChange={e => setamountToSend(e.target.value)} />
              </div>

              {nativeBalance && 
            <div className='m-2'>{formatBigNumberForDisplay(nativeBalance, BLOCKCHAIN_NATIVE_TOKEN.decimals, 2)} {BLOCKCHAIN_NATIVE_TOKEN.symbol}
              <button
                className="btn-primary w-48 m-2"
                onClick={async () => {
                  sendCeloTransaction();
                } }
              >
                Send CELO
              </button>
            </div>
              }

              {DAOTokenBalance && 
            <div className='m-2'>{formatBigNumberForDisplay(DAOTokenBalance, BLOCKCHAIN_DAO_TOKEN['decimals'])} {BLOCKCHAIN_DAO_TOKEN.symbol}
              <button
                className="btn-primary w-48 m-2"
                onClick={async () => {
                  sendTokenTransaction()
                } }
              >
                Send {BLOCKCHAIN_DAO_TOKEN.name}
              </button>
            </div>
              }
            </>
          )}

        </main>
      </div>
      
    </Layout>
  )

}

export default CryptoWallet