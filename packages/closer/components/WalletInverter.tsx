'use client'

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { type Chain } from 'viem';
import { useAccount, useBalance, useConnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';

import { Button } from './ui';

// The OP Sepolia chain ID, expected to be configured in the WagmiProvider via _app.tsx
const OP_SEPOLIA_CHAIN_ID = 11155420;

const IUSD_TOKEN_ADDRESS = '0x065775C7aB4E60ad1776A30DCfB15325d231Ce4F' as `0x${string}`;
const CLSR_TOKEN_ADDRESS = '0x050c24F1e840f8366753469aE7a2e81D0794F8ef' as `0x${string}`;

export default function WalletInverter() {
  const t = useTranslations();
  const { address, isConnected, chain } = useAccount();
  const { connect } = useConnect();
  const { switchChain } = useSwitchChain();

  const { data: iusdBalanceData, isLoading: isIusdBalanceLoading } = useBalance({
    address: address,
    token: IUSD_TOKEN_ADDRESS,
    chainId: OP_SEPOLIA_CHAIN_ID,
    query: { enabled: isConnected && !!address },
  });

  const { data: clsrBalanceData, isLoading: isClsrBalanceLoading } = useBalance({
    address: address,
    token: CLSR_TOKEN_ADDRESS,
    chainId: OP_SEPOLIA_CHAIN_ID,
    query: { enabled: isConnected && !!address },
  });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const correctChain = chain?.id === OP_SEPOLIA_CHAIN_ID;
  const isWalletReadyForDisplay = isConnected && correctChain;

  const getTitle = () => {
    if (!isConnected) {
      return t('wallet_not_connected_title');
    }
    if (!correctChain) {
      return t('wallet_incorrect_network');
    }
    // Assuming 'hasSameConnectedAccount' and 'isInsufficientBalance' are not relevant here
    // or handled differently for this specific component.
    return t('wallet_connected_title');
  };

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">

      <div className="flex items-center border-b border-[#e1e1e1] border-solid pb-2">
        {isWalletReadyForDisplay ? (
          <span className="mr-1">🟢</span>
        ) : (
          <span className="mr-1">🔴</span>
        )}
        <p>{getTitle()}</p>
      </div>

      {/* Balance Section */}
      {isConnected && ( 
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex justify-between items-center">
            <p>{t('wallet_iusd_balance')}</p> 
            {isIusdBalanceLoading ? (
              <p className="font-bold">Loading...</p>
            ) : (
              <p className="font-bold">{iusdBalanceData?.formatted} {iusdBalanceData?.symbol}</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p>{t('wallet_clsr_balance')}</p> 
            {isClsrBalanceLoading ? (
              <p className="font-bold">Loading...</p>
            ) : (
              <p className="font-bold">{clsrBalanceData?.formatted} {clsrBalanceData?.symbol}</p>
            )}
          </div>
        </div>
      )}
      

      {isConnected && !correctChain && switchChain && (
        <Button
          variant="secondary"
          className="mt-4 w-full uppercase"
          onClick={() => switchChain({ chainId: OP_SEPOLIA_CHAIN_ID })}
        >
          {t('wallet_switch_network')}
        </Button>
      )}
      {!isConnected && (
        <>
          <p className="my-4 text-xs">{t('wallet_not_connected_cta')}</p>
          <Button
            variant="secondary"
            className="mt-4 w-full uppercase"
            onClick={() => connect({ connector: injected(), chainId: OP_SEPOLIA_CHAIN_ID })}
          >
            {t('wallet_not_connected_button')}
          </Button>
        </>
      )}
    </div>
  );
}
