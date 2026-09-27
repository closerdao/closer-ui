import { useTranslations } from 'next-intl';

import {
  AccountingEntityProductSlug,
  STAY_BUNDLE_CHIP_SLUG,
  STAY_BUNDLE_PRODUCT_SLUGS,
  collectAssignedAccountingProductSlugs,
  isStayBundleProductSlug,
} from '../constants/accountingEntities.constants';
import { Information } from './ui';

function formatDefaultVatHint(rate: number | undefined): string {
  if (rate === undefined || Number.isNaN(rate)) return '';
  const pct = rate > 1 ? rate : rate * 100;
  const rounded = Math.round(pct * 100) / 100;
  return `${rounded}%`;
}

interface Props {
  elements: unknown[];
  vatByProductType: Record<string, number | undefined>;
  defaultVatRate?: number;
  onChange: (next: Record<string, number>) => void;
}

const AccountingEntitiesVatFields = ({
  elements,
  vatByProductType,
  defaultVatRate,
  onChange,
}: Props) => {
  const t = useTranslations();
  const assigned = collectAssignedAccountingProductSlugs(
    Array.isArray(elements) ? elements : [],
  );

  const slugsForVatField = (
    slug: AccountingEntityProductSlug,
  ): AccountingEntityProductSlug[] =>
    slug === STAY_BUNDLE_CHIP_SLUG ? [...STAY_BUNDLE_PRODUCT_SLUGS] : [slug];

  const displayVatForSlug = (slug: AccountingEntityProductSlug) => {
    if (slug === STAY_BUNDLE_CHIP_SLUG) {
      const stored =
        vatByProductType.accommodations ??
        vatByProductType.food ??
        vatByProductType.events ??
        vatByProductType.utilities;
      return stored !== undefined && stored !== null ? String(stored) : '';
    }
    const stored = vatByProductType[slug];
    return stored !== undefined && stored !== null ? String(stored) : '';
  };

  const setSlugValue = (slug: AccountingEntityProductSlug, raw: string) => {
    const trimmed = raw.trim();
    const keys = slugsForVatField(slug);
    if (trimmed === '') {
      const next = { ...vatByProductType };
      keys.forEach((key) => {
        delete next[key];
      });
      onChange(next as Record<string, number>);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n)) return;
    const next = { ...vatByProductType };
    keys.forEach((key) => {
      next[key] = n;
    });
    onChange(next as Record<string, number>);
  };

  const defaultHint = formatDefaultVatHint(defaultVatRate);

  return (
    <div className="flex flex-col gap-3">
      <Information>
        {defaultHint
          ? t('config_accounting_vat_hint_with_default', {
              defaultVat: defaultHint,
            })
          : t('config_accounting_vat_hint')}
      </Information>
      {assigned.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('config_accounting_vat_assign_products_first')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {assigned.map((slug) => {
            if (
              slug !== STAY_BUNDLE_CHIP_SLUG &&
              isStayBundleProductSlug(slug)
            ) {
              return null;
            }
            const display = displayVatForSlug(slug);
            return (
              <div key={slug} className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  {t(`config_product_${slug}`)}
                </label>
                <input
                  className="w-full max-w-xs px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  autoComplete="off"
                  value={display}
                  placeholder={
                    defaultHint
                      ? t('config_accounting_vat_placeholder_default', {
                          defaultVat: defaultHint,
                        })
                      : ''
                  }
                  onChange={(e) => setSlugValue(slug, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AccountingEntitiesVatFields;
