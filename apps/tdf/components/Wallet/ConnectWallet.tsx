import React, { useContext } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { usePresenceToken } from '../../hooks/usePresenceToken';
import { useSweatToken } from '../../hooks/useSweatToken';
import { useVotingWeight } from '../../hooks/useVotingWeight';

interface ConnectWalletProps {
  className?: string;
  variant?: 'full' | 'compact';
  showVotingWeight?: boolean;
}

/**
 * ConnectWallet component that can be used in both the navigation and the governance page
 * @param className - Additional CSS classes
 * @param variant - 'full' for the governance page, 'compact' for the navigation
 * @param showVotingWeight - Whether to show the voting weight
 */
const ConnectWallet: React.FC<ConnectWalletProps> = ({ 
  className = '', 
  variant = 'full',
  showVotingWeight = true
}) => {
  const {
    account,
    isWalletConnected,
    isWalletReady,
    isCorrectNetwork,
    balanceAvailable: tdfBalance,
  } = useContext(WalletState);
  
  const { connectWallet, switchNetwork } = useContext(WalletDispatch);
  const { user } = useAuth();
  const { presenceBalance } = usePresenceToken();
  const { sweatBalance } = useSweatToken();
  const { votingWeight, components } = useVotingWeight();
  
  const isCitizen = (): boolean => {
    // Check if user has the "citizen" role
    return user?.roles?.includes('citizen') || false;
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Determine the appropriate CSS classes based on the variant
  const containerClasses = variant === 'full' 
    ? `p-4 border rounded-lg shadow-sm ${className}`
    : `p-2 rounded-lg ${className}`;

  // If not connected, show connect button
  if (!isWalletConnected) {
    return (
      <div className={containerClasses}>
        {variant === 'full' && <h2 className="text-xl font-bold mb-4">Wallet Connection</h2>}
        <button
          onClick={connectWallet}
          className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded w-full"
        >
          Connect Wallet
        </button>
        {variant === 'full' && (
          <p className="mt-2 text-sm text-gray-500">
            Connect your wallet to participate in governance
          </p>
        )}
      </div>
    );
  }

  // If connected but wrong network, show switch network button
  if (!isCorrectNetwork) {
    return (
      <div className={containerClasses}>
        {variant === 'full' && <h2 className="text-xl font-bold mb-4">Wrong Network</h2>}
        <button
          onClick={switchNetwork}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Switch Network
        </button>
        {variant === 'full' && (
          <p className="mt-2 text-sm text-gray-500">
            Please switch to the correct network to interact with the platform
          </p>
        )}
      </div>
    );
  }

  // Connected and correct network
  return (
    <div className={containerClasses}>
      {variant === 'full' && <h2 className="text-xl font-bold mb-4">Wallet Connection</h2>}
      
      <div className={variant === 'compact' ? 'text-sm' : ''}>
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Address:</span>
          <span className="text-sm text-gray-500">{formatAddress(account || '')}</span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">TDF Balance:</span>
          <span>{tdfBalance || '0'}</span>
        </div>
        
        {variant === 'full' && (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Presence:</span>
              <span>{presenceBalance || '0'}</span>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Sweat:</span>
              <span>{sweatBalance}</span>
            </div>
          </>
        )}
        
        {showVotingWeight && (
          <div className="flex justify-between items-center mb-3 font-bold">
            <span>Voting Weight:</span>
            <span>{votingWeight.toFixed(2)}</span>
          </div>
        )}
        
        {variant === 'full' && !isCitizen() && (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
            <p className="text-sm">
              <strong>Note:</strong> You need to be a Citizen to vote on proposals.
              Please contact the DAO administrators for more information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectWallet;
