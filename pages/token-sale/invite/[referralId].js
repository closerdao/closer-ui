import { useContext, useEffect } from 'react';

import Layout from '../../../components/Layout';
import TokenSaleHeader from '../../../components/TokenSaleHeader';
import WhiteListConditions from '../../../components/WhiteListConditions';
import WhiteListed from '../../../components/WhiteListed';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import PropTypes from 'prop-types';

import config from '../../../config';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';
import { WalletState } from '../contexts/wallet';

dayjs.extend(customParseFormat);

const InvitedByPage = ({ referredBy }) => {
  const { user, isAuthenticated } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const isWhiteListed = isAuthenticated && isWalletReady;
  const saleDate = dayjs(config.TOKEN_SALE_DATE, 'DD/MM/YYYY');

  useEffect(() => {
    if (referredBy) {
      localStorage.setItem('referredBy', referredBy);
    }
  }, []);

  return (
    <Layout>
      <div className="w-full px-20 mt-20 font-marketing">
        <div className="flex mb-4">
          <TokenSaleHeader
            hasCountDown={config.IS_COUNTDOWN_ON}
            saleDate={saleDate}
            title={
              isWhiteListed
                ? __(
                    'token_sale_invite_page_whitelisted_title',
                    user?.screenname,
                  )
                : __('token_sale_invite_page_title')
            }
          />
        </div>
        <div className="flex flex-col gap-4">
          {isWhiteListed ? (
            <WhiteListed />
          ) : (
            <WhiteListConditions referredBy={referredBy} />
          )}
        </div>
      </div>
    </Layout>
  );
};

InvitedByPage.propTypes = {
  referredByUser: PropTypes.string,
};

export const getServerSideProps = async ({ query }) => {
  try {
    const res = await api.get(`/user/${query.referralId}`);
    return {
      props: {
        referredByUser: res.data.results,
      },
    };
  } catch (err) {
    if (err.response.status === 404) {
      return {
        redirect: {
          destination: '/token-sale/invite',
          permanent: false,
        },
      };
    }
    return {
      notFound: true,
    };
  }
};

export default InvitedByPage;
