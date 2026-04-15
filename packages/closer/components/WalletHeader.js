import { useContext } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { blockchainConfig } from '../config_blockchain';
import { userNeedsWalletLinked } from '../utils/auth.helpers';

const CeloLogo = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 950 950"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M375 850C237.665 850 125 737.335 125 600C125 462.665 237.665 350 375 350C496.88 350 599.52 436.747 620.867 550.001H770.96C748.345 354.096 579.985 200 375 200C186.34 200 32.5 353.84 32.5 542.5C32.5 731.16 186.34 885 375 885C444.393 885 508.865 864.098 563.25 828.75L490.87 756.37C458.39 780.82 418.5 795 375 795V850Z"
      fill="#FCFF52"
    />
    <path
      d="M575 100C712.335 100 825 212.665 825 350C825 487.335 712.335 600 575 600C453.12 600 350.48 513.253 329.133 399.999H179.04C201.655 595.904 370.015 750 575 750C763.66 750 917.5 596.16 917.5 407.5C917.5 218.84 763.66 65 575 65C505.607 65 441.135 85.902 386.75 121.25L459.13 193.63C491.61 169.18 531.5 155 575 155V100Z"
      fill="#FCFF52"
    />
  </svg>
);

const WalletHeader = ({ isInsufficientBalance }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const {
    isWalletConnected,
    isCorrectNetwork,
    isWalletReady,
    hasSameConnectedAccount,
    account,
  } = useContext(WalletState);

  const networkName = blockchainConfig.BLOCKCHAIN_NAME || 'CELO';

  const getTitle = () => {
    if (!isWalletConnected) {
      return t('wallet_not_connected_title');
    }
    if (!isCorrectNetwork) {
      return t('wallet_incorrect_network');
    }
    if (isInsufficientBalance) {
      return t('wallet_booking_insufficient_balance');
    }
    if (userNeedsWalletLinked(user)) {
      return t('wallet_not_connected_title');
    }
    if (!hasSameConnectedAccount) {
      return t('wallet_different_saved_address_title');
    }
    return t('wallet_connected_title');
  };

  const isHealthy = !isInsufficientBalance && isWalletReady;

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="rounded-lg bg-[#1c1c1c] p-3 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2a2a2a]">
            <CeloLogo />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-gray-400">
              {networkName}
            </span>
            <span className="text-sm font-semibold leading-tight">
              {getTitle()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isWalletReady && account && (
            <span className="text-[11px] font-mono text-gray-400">
              {formatAddress(account)}
            </span>
          )}
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isHealthy ? 'bg-[#FCFF52] shadow-[0_0_6px_#FCFF52]' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default WalletHeader;
