import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';

const CreditsBalance = ({ isDemo, className = '' }) => {
  const t = useTranslations();

  const { platform } = usePlatform();

  const { isAuthenticated } = useAuth();
  const [error, setErrors] = useState(false);
  const creditsBalance = platform.carrots.findBalance('carrots');

  const loadData = async () => {
    try {
      await platform.carrots.getBalance();
      setErrors(false);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-row items-center  space-2">
      {error && !isDemo && creditsBalance === undefined && isAuthenticated && (
        <div className="validation-error">{error}</div>
      )}
      <Link
        href="/settings/credits"
        className={`${twMerge('font-bold text-accent text-2xl', className)} `}
      >
        {t('carrots_balance')} {!isAuthenticated && '0.00'}
        {creditsBalance !== undefined &&
          isAuthenticated &&
          creditsBalance.toFixed(2)}
      </Link>
    </div>
  );
};

export default CreditsBalance;
