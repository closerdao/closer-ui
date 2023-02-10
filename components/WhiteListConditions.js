import Link from 'next/link';

import { useContext } from 'react';

import { useAuth } from '../contexts/auth';
import { WalletDispatch, WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
import ProfilePhoto from './ProfilePhoto';

const WhiteListConditions = ({ referredByUser }) => {
  const { isAuthenticated } = useAuth();
  const { connectWallet, switchNetwork } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletReady } = useContext(WalletState);
  return (
    <>
      <h2 className="mt-8 text-4xl leading-snug items-center flex">
        <span>{__('token_sale_invite_page_invited_by')}</span>
        <div className="bg-primary-light flex items-center ml-2 gap-2 px-4 py-2">
          <ProfilePhoto user={referredByUser} size="sm" />
          <span>{' ' + referredByUser?.screenname}</span>
        </div>
      </h2>
      <h3 className="mt-4 text-4xl leading-snug">
        {__('token_sale_invite_page_condition_title')}
      </h3>
      <ol className="list-decimal pl-8">
        <li className="mt-4 text-2xl leading-snug">
          <Link href="/signup" passHref>
            <a className="text-primary underline cursor-pointer">
              {__('signup_form_create')}
            </a>
          </Link>
          <span className="mx-2">{__('or')}</span>
          <Link href="/login" passHref>
            <a className="text-primary underline cursor-pointer">
              {__('navigation_sign_in')}
            </a>
          </Link>
          {isAuthenticated && (
            <img
              src="/images/token-sale/circle-check.svg"
              alt=""
              className="inline w-12 ml-5"
            />
          )}
        </li>
        <li className="mt-4 text-2xl leading-snug">
          <button
            className="text-primary underline cursor-pointer inline"
            onClick={connectWallet}
          >
            {__('wallet_not_connected_button')}
          </button>
          {isWalletReady && (
            <img
              src="/images/token-sale/circle-check.svg"
              alt=""
              className="inline w-12 ml-5"
            />
          )}
          {!isCorrectNetwork && (
            <button
              className="text-primary underline cursor-pointer inline ml-4"
              onClick={switchNetwork}
            >
              {__('wallet_switch_network')}
            </button>
          )}
        </li>
        <li className="mt-4 text-2xl leading-snug">
          {__('token_sale_invite_page_nominate_friends')}
        </li>
      </ol>
      <p>{__('token_sale_invite_page_process_description')}</p>
      <p>{__('token_sale_invite_page_process_price')}</p>
    </>
  );
};

export default WhiteListConditions;
