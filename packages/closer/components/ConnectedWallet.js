import { useDisconnect } from '@reown/appkit/react';
import { useAuth } from '../contexts/auth';
import api from '../utils/api';

const ConnectedWallet = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const { disconnect: disconnectWallet } = useDisconnect();

  const disconnect = async () => {
    try {
      await api.post('/auth/web3/unlink');
      await disconnectWallet();
    } catch (e) {
      console.error('error on disconnecting the wallet', e);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-gray-700">Connected wallet</h3>
        {isAdmin && (
          <button
            className="text-xs text-gray-500 hover:text-gray-700 underline"
            onClick={disconnect}
          >
            Disconnect
          </button>
        )}
      </div>
      <p className="text-xs text-gray-600 font-mono break-all">{user?.walletAddress}</p>
    </div>
  );
};

export default ConnectedWallet;
