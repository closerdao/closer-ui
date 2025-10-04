import React, { useContext, useState, useEffect } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';

interface WalletAndVotingProps {
  className?: string;
}

const WalletAndVoting: React.FC<WalletAndVotingProps> = ({ className }) => {
  const {
    account,
    isWalletConnected,
    isWalletReady,
    isCorrectNetwork,
    hasSameConnectedAccount,
    balanceTotal,
    proofOfPresence,
    error,
  } = useContext(WalletState);
  
  const { user } = useAuth();
  const { connectWallet } = useContext(WalletDispatch);
  
  const [votingWeight, setVotingWeight] = useState<number>(0);

  const isCitizen = (): boolean => {
    return user?.roles?.includes('member') || false;
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: string | undefined): string => {
    return parseFloat(balance || '0').toFixed(2);
  };

  // Calculate voting weight from actual wallet data
  useEffect(() => {
    if (!isWalletReady) {
      setVotingWeight(0);
      return;
    }

    // Parse TDF balance (using balanceTotal which includes staked tokens)
    const tdfValue = parseFloat(balanceTotal || '0');
    
    // Parse Presence balance (proofOfPresence from wallet context)
    const presenceValue = parseFloat(proofOfPresence || '0');
    
    // Mock Sweat balance (would be fetched from blockchain in real implementation)
    const sweatValue = 0.4;
    const sweatWeighted = sweatValue * 5;
    
    // Calculate total voting weight
    const totalWeight = tdfValue + presenceValue + sweatWeighted;
    
    setVotingWeight(totalWeight);
  }, [isWalletReady, balanceTotal, proofOfPresence]);

  const getNetworkStatus = () => {
    if (!isWalletConnected) return { status: 'disconnected', message: 'Wallet not connected' };
    if (!isCorrectNetwork) return { status: 'wrong-network', message: 'Wrong network' };
    if (!hasSameConnectedAccount) return { status: 'wrong-account', message: 'Account mismatch' };
    return { status: 'connected', message: 'Connected' };
  };

  const networkStatus = getNetworkStatus();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Wallet & Voting Power</h2>
        
        {!isWalletConnected ? (
          <div className="text-center">
            <button
              onClick={connectWallet}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
            <p className="mt-3 text-sm text-gray-500">
              Connect your wallet to participate in governance
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Wallet Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  networkStatus.status === 'connected' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {networkStatus.status === 'connected' ? 'Connected' : networkStatus.message}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Address: </span>
                <span className="font-mono text-gray-900">{formatAddress(account || '')}</span>
              </div>
            </div>

            {/* Token Balances - Only relevant ones */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Token Balances</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">TDF</span>
                  <span className="text-sm font-medium text-gray-900">{formatBalance(balanceTotal)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Presence</span>
                  <span className="text-sm font-medium text-gray-900">{formatBalance(proofOfPresence)}</span>
                </div>
              </div>
            </div>

            {/* Voting Weight */}
            {isWalletReady && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Voting Weight</span>
                  <span className="text-lg font-bold text-blue-600">{votingWeight.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  TDF + Presence + (Sweat × 5)
                </p>
              </div>
            )}

            {/* Citizen Status */}
            {!isCitizen() && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You need to be a Citizen to vote on proposals.
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletAndVoting;
