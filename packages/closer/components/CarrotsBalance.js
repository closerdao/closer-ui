import { useEffect, useState } from 'react';

import { __ } from '../utils/helpers';
import { usePlatform } from '../contexts/platform';


const Wallet = () => {
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);
  const [balanceTotal, setBalanceTotal] = useState(0);

  const loadData = async () => {
    try {
      const balance = await platform.carrots.getBalance();
      console.log('balance', balance);
      // setBalanceTotal(balance);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4 flex flex-col rounded-lg shadow-4xl">
      {error && <div className="validation-error">{error}</div>}
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex justify-between items-center">
          <p>{__('carrots_balance')}</p>
          <p className="font-bold">{balanceTotal.toFixed(2)}</p>
        </div>
      </div>
      {/* <CarrotActions COMING SOON /> */}
    </div>
  );
};

export default Wallet;
