import Link from 'next/link';

import { useEffect, useState } from 'react';

import { twMerge } from 'tailwind-merge';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { useConfig } from '../hooks/useConfig';
import { __ } from '../utils/helpers';

const CreditsBalance = ({ isDemo, className = '' }) => {
  const { platform } = usePlatform();
  const { APP_NAME } = useConfig() || {};
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
    <div className="flex flex-row items-center justify-center space-2">
      {error && !isDemo && creditsBalance === undefined && isAuthenticated && (
        <div className="validation-error">{error}</div>
      )}
      <Link
        href="/settings/credits"
        className={`${twMerge('font-bold text-accent text-2xl', className)} `}
      >
        {APP_NAME && __('carrots_balance', APP_NAME)}{' '}
        {!isAuthenticated && '0.00'}
        {creditsBalance !== undefined &&
          isAuthenticated &&
          creditsBalance.toFixed(2)}
      </Link>
    </div>
  );
};

export default CreditsBalance;
