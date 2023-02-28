import { useContext } from 'react';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import config from '../config';
import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
import Layout from './Layout';
import TokenSaleHeader from './TokenSaleHeader';
import WhiteListConditions from './WhiteListConditions';
import WhiteListed from './WhiteListed';

const TokenSaleMemberView = ({
  referredByUser,
  referredUsers,
  personalSaleDate,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { isWalletReady } = useContext(WalletState);

  const isWhiteListed = isAuthenticated && isWalletReady;

  return (
    <Layout>
      <div className="font-marketing w-full px-4 pb-20 mt-6 md:px-20 md:mt-20 ">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader
            hasCountDown={config.TOKEN_SALE_HAS_COUNTDOWN}
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
            <WhiteListed referredUsers={referredUsers} />
          ) : (
            <WhiteListConditions referredByUser={referredByUser} />
          )}
        </div>
      </div>
    </Layout>
  );
};

TokenSaleMemberView.propTypes = {
  referredByUser: PropTypes.oneOf([
    PropTypes.shape({
      _id: PropTypes.string,
      screenname: PropTypes.string,
    }),
    undefined,
  ]),
  referredUsers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      screenname: PropTypes.string,
    }),
  ),
  personalSaleDate: PropTypes.instanceOf(dayjs),
};

export default TokenSaleMemberView;
