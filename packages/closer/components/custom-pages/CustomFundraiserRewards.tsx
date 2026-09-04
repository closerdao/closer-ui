import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import InvestRewards from '../Invest/InvestRewards';
import { useBuyTokens } from '../../hooks/useBuyTokens';
import { useConfig } from '../../hooks/useConfig';
import { CreditConfig, FundraisingConfig } from '../../types';
import {
  getCachedConfig,
  getSavedConfig,
} from '../../utils/cachedConfig.helpers';
import { getCreditPricePerUnit } from '../../utils/credits.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';

interface Props {
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
}

const CustomFundraiserRewards: React.FC<Props> = () => {
  const t = useTranslations();
  const router = useRouter();
  const intlLocale = router.locale || undefined;
  const cachedFundraiserConfig = (getCachedConfig('fundraiser') ??
    {}) as FundraisingConfig;
  const liveFundraiserConfig = useConfig()?.fundraiser as
    | FundraisingConfig
    | undefined;
  const fundraisingConfig = {
    ...cachedFundraiserConfig,
    ...liveFundraiserConfig,
  } as FundraisingConfig;

  const isFundraiserEnabled =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(fundraisingConfig?.enabled);

  const { getTotalCostWithoutWallet } = useBuyTokens();
  const [tokenPrice, setTokenPrice] = useState<number>(0);

  useEffect(() => {
    if (!isFundraiserEnabled) return;
    (async () => {
      try {
        const price = await getTotalCostWithoutWallet('1');
        setTokenPrice(price);
      } catch (error) {
        console.error('Error fetching token price:', error);
        setTokenPrice(250);
      }
    })();
  }, [isFundraiserEnabled]);

  if (!isFundraiserEnabled) return null;

  const formatPrice = (tokens: number) => {
    if (!tokenPrice) return '...';
    return formatIsoFiatAmount(
      Math.round(tokens * tokenPrice),
      'EUR',
      intlLocale,
    );
  };

  return (
    <InvestRewards
      packages={fundraisingConfig?.packages ?? []}
      formatPrice={formatPrice}
      creditPricePerUnit={getCreditPricePerUnit(
        getCachedConfig('credit') as CreditConfig | null,
        fundraisingConfig,
        getSavedConfig('credit'),
      )}
      loanPackageHref="/dataroom"
      t={t}
    />
  );
};

export default CustomFundraiserRewards;
