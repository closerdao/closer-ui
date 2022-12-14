import { useWallet } from '../hooks/useWallet';
import { __, priceFormat } from '../utils/helpers';

const Wallet = () => {
  const { balance, tokenSymbol, isWalletConnected, connectWallet } = useWallet();

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
      <div>
        {isWalletConnected ? (
          <div className="flex justify-between items-center">
            <p className="my-4">{__('wallet_balance')}</p>
            <p className="font-bold">
              {priceFormat({ val: balance, cur: tokenSymbol })}
            </p>
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
    </div>
  );
};

export default Wallet;
