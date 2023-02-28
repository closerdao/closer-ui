import { useAuth } from '../contexts/auth';
import api from '../utils/api';

const ConnectedWallet = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');

  const disconnect = async () => {
    try {
      await api.post('/auth/web3/unlink');
    } catch (e) {
      console.error('error on disconnecting the wallet', e);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3>Connected wallet</h3>
      <p className="text-xs">{user?.walletAddress}</p>
      {isAdmin && (
        <button className="btn-primary w-fit mt-2" onClick={disconnect}>
          Disconnect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectedWallet;
