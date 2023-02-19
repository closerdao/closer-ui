import { useRouter } from 'next/router';

import { useEffect } from 'react';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { useAuth } from '../../contexts/auth';

dayjs.extend(customParseFormat);

const InvitedByPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const referredByUserId = router.query.referralId;

  const redirectToTokenSalePage = () => {
    router.push('/token-sale');
  };

  useEffect(() => {
    if (referredByUserId) {
      localStorage.setItem('referredByUserId', referredByUserId);
    }
    redirectToTokenSalePage();
  }, [user]);

  return null;
};

export default InvitedByPage;
