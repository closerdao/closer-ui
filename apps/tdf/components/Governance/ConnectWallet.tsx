import React, { useContext } from 'react';
import { WalletState, WalletDispatch } from 'closer/contexts/wallet';
import { useAuth } from 'closer/contexts/auth';
import { usePresenceToken } from '../../hooks/usePresenceToken';
import { useSweatToken } from '../../hooks/useSweatToken';
import { useVotingWeight } from '../../hooks/useVotingWeight';

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className }) => {
  const {
    account,
    isWalletConnected,
    isWalletReady,
    balanceAvailable: tdfBalance,
  } = useContext(WalletState);
  
  const { user } = useAuth();
  const { connectWallet } = useContext(WalletDispatch);
  const { presenceBalance } = usePresenceToken();
  const { sweatBalance } = useSweatToken();
  const { votingWeight } = useVotingWeight();
  
  const isCitizen = (): boolean => {
    // Check if user has the "citizen" role
    return user?.roles?.includes('member') || false;
  };
  
  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">Wallet Connection</h2>
      
      {!isWalletConnected ? (
        <div>
          <button
            onClick={connectWallet}
            className="bg-accent hover:bg-accent-dark text-white font-bold py-2 px-4 rounded w-full"
          >
            Connect Wallet
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Connect your wallet to participate in governance
          </p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Address:</span>
            <span className="text-sm text-gray-500">{formatAddress(account || '')}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">TDF Balance:</span>
            <span>{tdfBalance || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Presence:</span>
            <span>{presenceBalance || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium">Sweat:</span>
            <span>{sweatBalance}</span>
          </div>
          
          <div className="flex justify-between items-center mb-3 font-bold">
            <span>Voting Weight:</span>
            <span>{votingWeight.toFixed(2)}</span>
          </div>
          
          {!isCitizen() && (
            <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
              <p className="text-sm">
                <strong>Note:</strong> You need to be a Citizen to vote on proposals.
                Please contact the DAO administrators for more information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;
