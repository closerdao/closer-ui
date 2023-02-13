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
import { usePlatform } from '../../../contexts/platform';
import { WalletState } from '../../../contexts/wallet';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

dayjs.extend(customParseFormat);

const InvitedByPage = ({ referredBy }) => {
  const { user, isAuthenticated } = useAuth();
  const { isWalletReady } = useContext(WalletState);
  const { platform } = usePlatform();

  const isWhiteListed = isAuthenticated && isWalletReady;
  const generalSaleDate = dayjs(config.TOKEN_SALE_DATE, 'DD/MM/YYYY');

  const params = {
    sort_by: '-created',
    where: { referredBy: user?._id },
  };
  const referredUsers = platform.user.find(params);
  const totalReferred = platform.user.findCount(params);
  const personalSaleDate = generalSaleDate.subtract(totalReferred, 'day');

  const loadData = async () => {
    try {
      await Promise.all([
        platform.user.get(params),
        platform.user.getCount(params),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadData();
    }
    if (referredBy) {
      localStorage.setItem('referredBy', referredBy);
    }
  }, [user]);

  return (
    <Layout>
      <div className="font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader
            hasCountDown={config.IS_COUNTDOWN_ON}
            saleDate={personalSaleDate}
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
            <WhiteListed referredUsers={referredUsers?.toJS()} />
          ) : (
            <WhiteListConditions referredBy={referredBy} />
          )}
        </div>
      </div>
    </Layout>
  );
};

InvitedByPage.propTypes = {
  referredBy: PropTypes.shape({
    _id: PropTypes.string,
    screenname: PropTypes.string,
  }).isRequired,
};

export const getServerSideProps = async ({ query }) => {
  try {
    const res = await api.get(`/user/${query.referralId}`);
    return {
      props: {
        referredBy: res.data.results,
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
