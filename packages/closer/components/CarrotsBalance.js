import { useEffect, useState } from 'react';

import { __ } from '../utils/helpers';
import { usePlatform } from '../contexts/platform';
import Link from 'next/link';

const CarrotsBalance = () => {
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);

  const loadData = async () => {
    try {
      await platform.carrots.getBalance();
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pt-2 flex flex-row items-center justify-center space-2">
      {error && <div className="validation-error">{error}</div>}
      <Link href='/settings/carrots' className="font-bold text-accent text-2xl">{__('carrots_balance')} {(platform.carrots.findBalance('carrots') || 0 ).toFixed(2)}</Link>
      {/* <CarrotActions COMING SOON /> */}
    </div>
  );
};

export default CarrotsBalance;
