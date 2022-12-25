import { useWallet } from '../hooks/useWallet';
import { __ } from '../utils/helpers';

const Wallet = () => {
  const {
    balanceTotal,
    balanceAvailable,
    isWalletConnected,
    connectWallet,
    switchNetwork,
    isCorrectNetwork,
  } = useWallet();

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      <div className="flex items-center border-b border-[#e1e1e1] border-solid pb-2">
        {isWalletConnected ? (
          <span className="mr-1">🟢</span>
        ) : (
          <span className="mr-1">🔴</span>
        )}
        <p>
          {isWalletConnected
            ? __('wallet_connected_title')
            : __('wallet_not_connected_title')}
        </p>
      </div>
      {!isCorrectNetwork ? (
        <button className="btn mt-4 w-full uppercase" onClick={switchNetwork}>
          {__('blockchain_switch_chain')}
        </button>
      ) : (
        <div>
          {isWalletConnected ? (
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center">
                <p>{__('wallet_tdf')}</p>
                <p className="font-bold">{balanceTotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p>{__('wallet_tdf_available')}</p>
                <p className="font-bold">{balanceAvailable.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p>{__('wallet_pop')}</p>
                <p className="font-bold">0.00</p>
              </div>
            </div>
          ) : (
            <>
              <p className="my-4 text-xs">{__('wallet_not_connected_cta')}</p>
              <button
                className="btn mt-4 w-full uppercase"
                onClick={connectWallet}
              >
                {__('wallet_not_connected_button')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Wallet;
