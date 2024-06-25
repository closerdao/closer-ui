import Link from 'next/link';
import { useRouter } from 'next/router';

import { useContext } from 'react';

import PropTypes from 'prop-types';
import { useTranslations } from 'next-intl';

import { useAuth } from '../contexts/auth';
import { WalletDispatch, WalletState } from '../contexts/wallet';
import ProfilePhoto from './ProfilePhoto';
import Heading from './ui/Heading';

const WhiteListConditions = ({ referredByUser }) => {
  const t = useTranslations();

  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { connectWallet, switchNetwork } = useContext(WalletDispatch);
  const { isCorrectNetwork, isWalletReady, isWalletConnected } =
    useContext(WalletState);
  return (
    <>
      {referredByUser && (
        <Heading
          level={2}
          className="mt-8 text-3xl md:text-4xl leading-snug md:items-center flex flex-col md:flex-row"
        >
          <span>{t('token_sale_invite_page_invited_by')}</span>
          <div className="w-fit bg-accent-light flex items-center ml-2 gap-2 px-4 py-2">
            <ProfilePhoto user={referredByUser} size="sm" />
            <span>{' ' + referredByUser?.screenname}</span>
          </div>
        </Heading>
      )}
      <h3 className="mt-4 text-4xl leading-snug">
        {t('token_sale_invite_page_condition_title')}
      </h3>
      <ol className="list-decimal pl-8 pb-8 md:pb-0">
        <li className="mt-4 text-xl md:text-2xl leading-snug relative">
          <Link
            href={`/signup?back=${router.asPath}`}
            passHref
            className="text-accent underline cursor-pointer"
          >
            {t('signup_form_create')}
          </Link>
          <span className="mx-2">{t('or')}</span>
          <Link
            href={`/login?back=${router.asPath}`}
            passHref
            className="text-accent underline cursor-pointer"
          >
            {t('navigation_sign_in')}
          </Link>
          {isAuthenticated && (
            <img
              src="/images/token-sale/circle-check.svg"
              alt=""
              className="inline w-8 md:w-12 ml-5 absolute -top-1"
            />
          )}
        </li>
        <li className="mt-4 text-xl md:text-2xl leading-snug">
          {isWalletConnected && !isCorrectNetwork ? (
            <button
              className="text-accent underline cursor-pointer inline ml-4"
              onClick={switchNetwork}
            >
              {t('wallet_switch_network')}
            </button>
          ) : (
            <button
              className="text-accent underline cursor-pointer inline"
              onClick={connectWallet}
            >
              {t('wallet_not_connected_button')}
            </button>
          )}
          {isWalletReady && (
            <img
              src="/images/token-sale/circle-check.svg"
              alt=""
              className="inline w-12 ml-5"
            />
          )}
        </li>
        <li className="mt-4 text-xl md:text-2xl leading-snug">
          {t('token_sale_invite_page_nominate_friends')}
        </li>
      </ol>
      <p>{t('token_sale_invite_page_process_description')}</p>
      <p>{t('token_sale_invite_page_process_price')}</p>
    </>
  );
};

WhiteListConditions.propTypes = {
  referredByUser: PropTypes.oneOf([
    PropTypes.shape({
      _id: PropTypes.string,
      screenname: PropTypes.string,
    }),
    undefined,
  ]),
};

export default WhiteListConditions;
