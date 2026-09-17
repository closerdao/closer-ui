import { useTranslations } from 'next-intl';

import type {
  AccountingEntitiesConfig,
  AccountingEntityElement,
} from '../types/api';
import { resolveAccountingEntityForProduct } from '../utils/accountingEntityResolve';
import { getCachedConfig } from '../utils/cachedConfig.helpers';

/**
 * Footnote under a "Payment details" section naming the accounting entity the
 * payment goes to. Renders nothing when accounting entities are disabled or no
 * entity is assigned to the product type.
 */
const AccountingEntityFootnote = ({
  productSlug,
  className,
}: {
  productSlug: string;
  className?: string;
}) => {
  const t = useTranslations();
  const accountingConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;

  if (!accountingConfig?.enabled) return null;
  const entity: AccountingEntityElement | null =
    resolveAccountingEntityForProduct(productSlug, accountingConfig.elements);
  if (!entity?.legalName?.trim()) return null;

  return (
    <p className={`text-xs text-gray-500 ${className || ''}`}>
      {t('payment_details_paid_to_entity', { entity: entity.legalName.trim() })}
    </p>
  );
};

export default AccountingEntityFootnote;
