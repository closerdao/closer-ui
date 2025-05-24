'use client'

import { useState, useEffect } from 'react'
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi'
import { type Chain } from 'viem'
import { injected } from 'wagmi/connectors'

// Define OP Sepolia chain details (consistent with layout.tsx)
const opSepolia = {
  id: 11155420,
  name: 'OP Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.optimism.io'] },
    public: { http: ['https://sepolia.optimism.io'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia-optimistic.etherscan.io' },
  },
  testnet: true,
} as const satisfies Chain;

// Address of the ERC20Mock token on testnets from Inverter documentation
const IUSD_TOKEN_ADDRESS = '0x065775C7aB4E60ad1776A30DCfB15325d231Ce4F' as `0x${string}`
const CLSR_TOKEN_ADDRESS = '0x050c24F1e840f8366753469aE7a2e81D0794F8ef' as `0x${string}`

export default function Inverter() {
  const { address, isConnected, chain } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  const { data: iusdBalanceData, isLoading: isIusdBalanceLoading, error: iusdBalanceError } = useBalance({
    address: address,
    token: IUSD_TOKEN_ADDRESS,
    chainId: opSepolia.id,
    query: { enabled: isConnected && !!address },
  })

  const { data: clsrBalanceData, isLoading: isClsrBalanceLoading, error: clsrBalanceError } = useBalance({
    address: address,
    token: CLSR_TOKEN_ADDRESS,
    chainId: opSepolia.id,
    query: { enabled: isConnected && !!address },
  })

  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null;
  }

  const correctChain = chain?.id === opSepolia.id;

  return (
    <div className="w-screen min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold">Token Balances</h1>

      {isConnected ? (
        <>
          <p>Connected as: <span className="font-mono text-sm break-all">{address}</span></p>
          <p>Network: <span className="font-mono text-sm">{chain?.name} ({chain?.id})</span></p>
          {!correctChain && <p className="text-red-500 font-bold">Please switch to OP Sepolia network in your wallet.</p>}
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Disconnect Wallet
          </button>

          {/* Balance Displays */}
          <div className="mt-2 p-3 border rounded-md w-full max-w-md">
            <h2 className="text-lg font-semibold">IUSD Balance</h2>
            <p className="font-mono text-xs break-all">Token Address: {IUSD_TOKEN_ADDRESS}</p>
            {isIusdBalanceLoading && <p>Loading IUSD balance...</p>}
            {iusdBalanceError && <p className="text-red-500">Error: {iusdBalanceError.message}</p>}
            {iusdBalanceData && <p>Balance: {iusdBalanceData.formatted} {iusdBalanceData.symbol}</p>}
          </div>

          <div className="mt-2 p-3 border rounded-md w-full max-w-md">
            <h2 className="text-lg font-semibold">CLSR Token Balance</h2>
            <p className="font-mono text-xs break-all">Token Address: {CLSR_TOKEN_ADDRESS}</p>
            {isClsrBalanceLoading && <p>Loading CLSR balance...</p>}
            {clsrBalanceError && <p className="text-red-500">Error: {clsrBalanceError.message}</p>}
            {clsrBalanceData && <p>Balance: {clsrBalanceData.formatted} {clsrBalanceData.symbol}</p>}
          </div>
        </>
      ) : (
        <button
          onClick={() => connect({ connector: injected() })}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl hover:bg-blue-600"
        >
          Connect Wallet
        </button>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <p>This page displays your IUSD and CLSR token balances.</p>
        <p>Ensure your wallet is connected to the <span className="font-semibold">OP Sepolia</span> testnet.</p>
      </div>
    </div>
  )
}
