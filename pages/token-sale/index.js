import { useEffect, useState } from 'react';

import TokenSaleGuestView from '../../components/TokenSaleGuestView';
import TokenSaleMemberView from '../../components/TokenSaleMemberView';
import TokenSaleOpenView from '../../components/TokenSaleView';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import config from '../../config';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';

dayjs.extend(customParseFormat);

const TokenSalePage = () => {
  const { platform } = usePlatform();
  const { isAuthenticated, user } = useAuth();

  const [referredByUserId, setReferredByUserId] = useState(null);
  useEffect(() => {
    const id = localStorage.getItem('referredByUserId');
    setReferredByUserId(id);
  }, []);

  const generalSaleDate = dayjs(config.TOKEN_SALE_DATE, 'DD/MM/YYYY');

  const getUsersParams = {
    sort_by: '-created',
    where: { referredBy: user?._id },
  };
  const referredUsers = platform.user.find(getUsersParams);
  const totalReferred = platform.user.findCount(getUsersParams);
  const referredByUser = referredByUserId
    ? platform.user.findOne(referredByUserId)
    : undefined;

  const personalSaleDate = generalSaleDate.subtract(totalReferred, 'day');
  const hasSaleStarted = dayjs().isAfter(personalSaleDate);

  useEffect(() => {
    const loadData = async (params) => {
      try {
        await Promise.all([
          platform.user.get(params),
          platform.user.getCount(params),
        ]);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?._id) {
      loadData(getUsersParams);
    }
  }, [user]);

  if (!isAuthenticated) {
    return <TokenSaleGuestView />;
  }

  if (hasSaleStarted) {
    return <TokenSaleOpenView />;
  }

  return (
    <TokenSaleMemberView
      referredByUser={referredByUser}
      referredUsers={referredUsers ? referredUsers.toJS() : []}
      personalSaleDate={personalSaleDate}
    />
  );
};

export default TokenSalePage;
