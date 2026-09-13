import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import type { CreditConfig, FundraisingConfig } from '../../types/api';
import {
  getCachedConfig,
  getSavedConfig,
} from '../../utils/cachedConfig.helpers';
import {
  getCreditPackages,
  getCreditPricePerUnit,
  getCreditPurchaseLimits,
  isCreditPurchaseEnabled,
} from '../../utils/credits.helpers';
import { priceFormat } from '../../utils/helpers';
import { Card, Heading, LinkButton } from '../ui';

interface Props {
  className?: string;
}

/**
 * "Buy credits" on the credits settings page. Renders nothing when the
 * village does not sell credits, so the page keeps working as a pure
 * explainer for platforms that only grant them.
 */
const CreditsBuyCta = ({ className }: Props) => {
  const t = useTranslations();

  const creditConfig = getCachedConfig('credit') as CreditConfig | null;
  const savedCreditConfig = getSavedConfig('credit');
  const fundraisingConfig = getCachedConfig(
    'fundraiser',
  ) as FundraisingConfig | null;

  const pricePerUnit = getCreditPricePerUnit(
    creditConfig,
    fundraisingConfig,
    savedCreditConfig,
  );
  const limits = useMemo(
    () => getCreditPurchaseLimits(creditConfig),
    [creditConfig],
  );
  const packages = useMemo(
    () => getCreditPackages(creditConfig, pricePerUnit),
    [creditConfig, pricePerUnit],
  );

  if (!isCreditPurchaseEnabled({ creditConfig, fundraisingConfig })) {
    return null;
  }

  const defaultAmount = packages[0]?.credits ?? limits.min;

  return (
    <Card className={className}>
      <div className="flex flex-wrap justify-between items-baseline gap-2">
        <Heading level={3}>{t('credits_buy_heading')}</Heading>
        <span className="text-sm text-gray-600">
          {t('credits_buy_price', {
            price: priceFormat(pricePerUnit, DEFAULT_CURRENCY),
          })}
        </span>
      </div>

      <p className="text-sm text-gray-700">{t('credits_buy_description')}</p>

      {packages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {packages.map((pkg) => (
            <LinkButton
              key={`${pkg.title || 'package'}-${pkg.credits}`}
              href={`/credits/checkout?amount=${pkg.credits}`}
              variant="secondary"
              size="small"
              isFullWidth={false}
              className="!normal-case tracking-normal"
            >
              {`🥕 ${pkg.credits} · ${priceFormat(
                pkg.price,
                DEFAULT_CURRENCY,
              )}`}
            </LinkButton>
          ))}
        </div>
      )}

      <LinkButton href={`/credits/checkout?amount=${defaultAmount}`}>
        {t('credits_buy_cta')}
      </LinkButton>
    </Card>
  );
};

export default CreditsBuyCta;
