import { useState, useEffect, useContext } from 'react';
import { WalletState } from 'closer/contexts/wallet';
import { usePresenceToken } from './usePresenceToken';
import { useSweatToken } from './useSweatToken';

export const useVotingWeight = () => {
  const { isWalletReady, balanceAvailable: tdfBalance } = useContext(WalletState);
  const { presenceBalance } = usePresenceToken();
  const { sweatBalance } = useSweatToken();
  
  const [votingWeight, setVotingWeight] = useState<number>(0);
  const [components, setComponents] = useState<{
    tdf: number;
    presence: number;
    sweat: number;
    sweatWeighted: number;
  }>({
    tdf: 0,
    presence: 0,
    sweat: 0,
    sweatWeighted: 0,
  });

  useEffect(() => {
    if (!isWalletReady) {
      setVotingWeight(0);
      setComponents({
        tdf: 0,
        presence: 0,
        sweat: 0,
        sweatWeighted: 0,
      });
      return;
    }

    // Parse TDF balance
    const tdfValue = parseFloat(tdfBalance || '0');
    
    // Parse Presence balance
    // In a real implementation, this would convert from wei to ether if needed
    const presenceValue = parseFloat(presenceBalance || '0');
    
    // Parse Sweat balance
    const sweatValue = parseFloat(sweatBalance || '0');
    
    // Calculate weighted Sweat value (Sweat * 5)
    const sweatWeighted = sweatValue * 5;
    
    // Calculate total voting weight
    const totalWeight = tdfValue + presenceValue + sweatWeighted;
    
    setVotingWeight(totalWeight);
    setComponents({
      tdf: tdfValue,
      presence: presenceValue,
      sweat: sweatValue,
      sweatWeighted,
    });
  }, [isWalletReady, tdfBalance, presenceBalance, sweatBalance]);

  return {
    votingWeight,
    components,
    formula: '$TDF + $Presence + ($Sweat * 5)',
  };
};
