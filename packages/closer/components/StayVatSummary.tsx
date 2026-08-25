import { useTranslations } from 'next-intl';

import type { AccountingEntitiesConfig } from '../types/api';
import type { PriceLock } from '../types/stay';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { formatStayMoney } from '../utils/stays.api';
import {
  computeStayVatBreakdown,
  formatVatRatePercent,
  hasMultipleVatRates,
} from '../utils/stayVat';

/**
 * "Including Tax (VAT)" summary rows. When the price-lock lines are taxed at
 * more than one rate (per-product VAT from the accounting-entities config),
 * the total is itemized per product line; with a single rate only the total
 * row renders, as before. The itemized total is the sum of the parts so the
 * rows always add up on screen.
 */
const StayVatSummary = ({
  priceLock,
  dense,
}: {
  priceLock: PriceLock;
  /** Compact styling for the payment-page summary card. */
  dense?: boolean;
}) => {
  const t = useTranslations();
  const accountingConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;
  const paymentConfig = getCachedConfig('payment') as {
    vatRate?: number;
  } | null;

  const rows = computeStayVatBreakdown(
    priceLock,
    accountingConfig?.enabled
      ? accountingConfig.vatByProductType
      : undefined,
    paymentConfig?.vatRate,
  );
  const showBreakdown = hasMultipleVatRates(rows);
  const total = showBreakdown
    ? {
        val:
          Math.round(rows.reduce((sum, r) => sum + r.amount.val, 0) * 100) /
          100,
        cur: rows[0].amount.cur,
      }
    : priceLock.vat ?? { val: 0, cur: priceLock.total.cur };

  return (
    <>
      <div
        className={
          dense
            ? 'flex justify-between gap-2 text-gray-600'
            : 'flex justify-between items-baseline'
        }
      >
        <span className={dense ? 'italic' : 'italic text-gray-600'}>
          {t('stay_create_line_tax_included')}
        </span>
        <span className={dense ? 'tabular-nums shrink-0' : 'text-gray-900'}>
          {formatStayMoney(total)}
        </span>
      </div>
      {showBreakdown &&
        rows.map((row) => (
          <div
            key={row.key}
            className={`flex justify-between items-baseline gap-2 pl-3 text-gray-500 ${
              dense ? 'text-[11px]' : 'text-xs'
            }`}
          >
            <span>
              {t(`stay_create_line_${row.key}`)} (
              {formatVatRatePercent(row.rate)}%)
            </span>
            <span className="tabular-nums shrink-0">
              {formatStayMoney(row.amount)}
            </span>
          </div>
        ))}
    </>
  );
};

export default StayVatSummary;
