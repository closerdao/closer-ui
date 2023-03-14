import { useEffect, useState } from 'react';

import TokenSaleGuestView from '../../components/TokenSaleGuestView';
import TokenSaleMemberView from '../../components/TokenSaleMemberView';
import TokenSaleOpenView from '../../components/TokenSaleView';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';

dayjs.extend(customParseFormat);

const TokenSalePage = () => {
  const { platform } = usePlatform();
  const { isAuthenticated, user } = useAuth();
  const [referredByUserId, setReferredByUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
    setReferredByUserId(id);
  }, []);

  const TOKEN_SALE_DATE = process.env.NEXT_PUBLIC_TOKEN_SALE_DATE;
  const generalSaleDate = dayjs(TOKEN_SALE_DATE, 'DD/MM/YYYY');

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

  if (!TOKEN_SALE_DATE) {
    return (
      <div className="flex flex-1 items-center text-primary">
        TOKEN_SALE_DATE is not defined
      </div>
    );
  }

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
