import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
import type { AccountingEntitiesConfig } from '../../types/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { priceFormat } from '../../utils/helpers';
import { formatVatRatePercent, normalizeVatRate } from '../../utils/stayVat';
import AccountingEntityFootnote from '../AccountingEntityFootnote';

/**
 * Donation total, included VAT, and receiving entity — shared by the
 * card and crypto donation payment pages. VAT is the portion included in
 * the (VAT-inclusive) total, at the donations rate from the
 * accounting-entities config, falling back to the payment default rate.
 */
const DonationSummary = ({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) => {
  const t = useTranslations();
  const accountingConfig = getCachedConfig(
    'accounting-entities',
  ) as AccountingEntitiesConfig | null;
  const paymentConfig = getCachedConfig('payment') as {
    vatRate?: number;
  } | null;
  const vatRate =
    (accountingConfig?.enabled
      ? normalizeVatRate(accountingConfig.vatByProductType?.donations)
      : null) ??
    normalizeVatRate(paymentConfig?.vatRate) ??
    0;
  const taxIncluded =
    Math.round(((amount * vatRate) / (1 + vatRate)) * 100) / 100;

  return (
    <div className={className}>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2 bg-white">
          <span className="text-sm text-gray-600">
            {t('donate_invoice_amount_label')}
          </span>
          <span className="text-base font-semibold text-gray-900 tabular-nums">
            {priceFormat(amount, DEFAULT_CURRENCY)}
          </span>
        </div>
        <div className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2 bg-white">
          <span className="text-sm italic text-gray-600">
            {t('stay_create_line_tax_included')} ({formatVatRatePercent(vatRate)}
            %)
          </span>
          <span className="text-sm text-gray-900 tabular-nums">
            {priceFormat(taxIncluded, DEFAULT_CURRENCY)}
          </span>
        </div>
      </div>
      <AccountingEntityFootnote productSlug="donations" className="mt-2" />
    </div>
  );
};

export default DonationSummary;
