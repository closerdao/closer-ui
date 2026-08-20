import { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { useSaleCharges } from '../../hooks/useSaleCharges';
import type { Sale, SaleChargeRecord } from '../../types/api';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import {
  chargeStatusBadgeVariant,
  chargeStatusLabelKey,
} from '../../utils/orderStatusBadge';
import IdDisplay from '../display/idDisplay';
import { Spinner } from '../ui/';
import { Badge } from '../ui/badge';

const DetailRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm break-words">{children}</span>
  </div>
);

const formatDateTime = (value?: string, locale?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale || 'en');
};

const formatMoney = (
  amount: { val?: number; cur?: string } | undefined,
  locale?: string,
) => {
  if (!amount || typeof amount.val !== 'number') return '';
  return formatIsoFiatAmount(amount.val, amount.cur || 'EUR', locale);
};

const ChargeRow = ({
  charge,
  locale,
}: {
  charge: SaleChargeRecord;
  locale?: string;
}) => {
  const t = useTranslations();
  const descriptors = [charge.type, charge.method, charge.entity]
    .map((part) => part?.trim())
    .filter(Boolean);
  const timestamp = formatDateTime(charge.date || charge.created, locale);
  const breakdown = [
    charge.taxAmount?.val
      ? `${t('sale_details_charge_tax')} ${formatMoney(charge.taxAmount, locale)}`
      : '',
    charge.platformRevenue?.val
      ? `${t('sale_details_charge_platform_revenue')} ${formatMoney(
          charge.platformRevenue,
          locale,
        )}`
      : '',
    charge.netRevenue?.val
      ? `${t('sale_details_charge_net_revenue')} ${formatMoney(
          charge.netRevenue,
          locale,
        )}`
      : '',
  ].filter(Boolean);

  return (
    <div className="rounded-md border border-border bg-background p-3 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <IdDisplay
          value={charge._id}
          head={10}
          tail={6}
          className="text-xs text-muted-foreground"
        />
        <div className="flex items-center gap-2">
          {charge.status ? (
            <Badge variant={chargeStatusBadgeVariant(charge.status)}>
              {t(chargeStatusLabelKey(charge.status))}
            </Badge>
          ) : null}
          <span className="font-mono text-sm">
            {formatMoney(charge.amount?.total, locale) || '—'}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {descriptors.join(' · ')}
        {timestamp ? `${descriptors.length ? ' · ' : ''}${timestamp}` : ''}
      </p>
      {charge.meta?.memoCode || charge.meta?.senderIban ? (
        <p className="text-xs text-muted-foreground">
          {charge.meta?.memoCode
            ? `${t('sale_details_charge_memo')} ${charge.meta.memoCode}`
            : ''}
          {charge.meta?.senderIban
            ? `${charge.meta?.memoCode ? ' · ' : ''}${t(
                'sale_details_charge_iban',
              )} ${charge.meta.senderIban}`
            : ''}
        </p>
      ) : null}
      {breakdown.length > 0 ? (
        <p className="text-xs text-muted-foreground">{breakdown.join(' · ')}</p>
      ) : null}
    </div>
  );
};

/**
 * Everything an admin needs to validate a sale but that is too much for the
 * table row: the full id, the payment trail and the KYC snapshot.
 */
const SaleDetails = ({ sale, locale }: { sale: Sale; locale?: string }) => {
  const t = useTranslations();
  const {
    charges,
    isLoading: isLoadingCharges,
    error: chargesError,
  } = useSaleCharges(sale._id);
  const kyc = sale.kyc;
  const kycAddress = [kyc?.address1, kyc?.address2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  const kycLocality = [kyc?.postalCode, kyc?.city, kyc?.state, kyc?.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
  const hasKyc = Boolean(
    kyc &&
      (kyc.legalName ||
        kyc.TIN ||
        kycAddress ||
        kycLocality ||
        kyc.kycStatus ||
        kyc.walletAddress),
  );

  return (
    <div className="space-y-4 rounded-lg bg-muted/30 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <DetailRow label={t('sale_details_sale_id')}>
          <IdDisplay value={sale._id} head={10} tail={6} />
        </DetailRow>
        <DetailRow label={t('sale_details_product_type')}>
          {sale.product_type || '—'}
        </DetailRow>
        <DetailRow label={t('sale_details_payment_method')}>
          {sale.paymentMethod || '—'}
        </DetailRow>
        <DetailRow label={t('sale_details_entity')}>
          {sale.entity || '—'}
        </DetailRow>
        {sale.memoCode ? (
          <DetailRow label={t('sale_details_memo_code')}>
            <span className="font-mono">{sale.memoCode}</span>
          </DetailRow>
        ) : null}
        {sale.tx_hash ? (
          <DetailRow label={t('sale_details_tx_hash')}>
            <IdDisplay value={sale.tx_hash} head={10} tail={6} />
          </DetailRow>
        ) : null}
        <DetailRow label={t('sale_details_created')}>
          {formatDateTime(sale.created, locale) || '—'}
        </DetailRow>
        <DetailRow label={t('sale_details_updated')}>
          {formatDateTime(sale.updated, locale) || '—'}
        </DetailRow>
        {sale.message ? (
          <DetailRow label={t('sale_details_message')}>
            {sale.message}
          </DetailRow>
        ) : null}
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sale_details_charges')}
        </p>
        {isLoadingCharges ? (
          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
            <Spinner />
            {t('sale_details_charges_loading')}
          </div>
        ) : chargesError ? (
          <p className="text-sm text-red-500">
            {t('sale_details_charges_error')}
          </p>
        ) : charges && charges.length > 0 ? (
          <div className="space-y-2">
            {charges.map((charge) => (
              <ChargeRow key={charge._id} charge={charge} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('sale_details_charges_empty')}
          </p>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('sale_details_kyc')}
        </p>
        {hasKyc ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow label={t('sale_details_kyc_legal_name')}>
              {kyc?.legalName || kyc?.userName || '—'}
            </DetailRow>
            <DetailRow label={t('sale_details_kyc_email')}>
              {kyc?.email || sale.email || '—'}
            </DetailRow>
            <DetailRow label={t('sale_details_kyc_tin')}>
              {kyc?.TIN || '—'}
            </DetailRow>
            <DetailRow label={t('sale_details_kyc_address')}>
              {kycAddress || '—'}
            </DetailRow>
            <DetailRow label={t('sale_details_kyc_locality')}>
              {kycLocality || '—'}
            </DetailRow>
            <DetailRow label={t('sale_details_kyc_status')}>
              {kyc?.kycStatus || '—'}
            </DetailRow>
            {kyc?.walletAddress ? (
              <DetailRow label={t('sale_details_kyc_wallet')}>
                <IdDisplay value={kyc.walletAddress} head={10} tail={6} />
              </DetailRow>
            ) : null}
            {kyc?.recordedAt ? (
              <DetailRow label={t('sale_details_kyc_recorded_at')}>
                {formatDateTime(kyc.recordedAt, locale) || '—'}
              </DetailRow>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('sale_details_kyc_missing')}
          </p>
        )}
      </div>
    </div>
  );
};

export default SaleDetails;
