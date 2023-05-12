import { useEffect, useState } from 'react';

import { __ } from '../utils/helpers';
import { usePlatform } from '../contexts/platform';


const Wallet = () => {
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
    <div className="pt-2 flex flex-col items-center justify-center space-2">
      {error && <div className="validation-error">{error}</div>}
      <p>{__('carrots_balance')}</p>
      <p className="font-bold">{(platform.carrots.findBalance('carrots') || 0 ).toFixed(2)}</p>
      {/* <CarrotActions COMING SOON /> */}
    </div>
  );
};

export default Wallet;
