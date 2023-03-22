import { useContext } from 'react';

import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { useAuth } from '../contexts/auth';
import { WalletState } from '../contexts/wallet';
import { __ } from '../utils/helpers';
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
    <>
      <div className="font-marketing w-full px-4 pb-20 mt-6">
        <div className="flex flex-col mb-4 md:flex-row">
          <TokenSaleHeader
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
    </>
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
