import { useState } from 'react';

import { useTranslations } from 'next-intl';

import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import Modal from '../Modal';
import { Checkbox, Input } from '../ui/';
import Button from '../ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import UserSearchInput, { UserSearchResult } from './UserSearchInput';

// Only token sales are entered by hand today - the endpoint accepts every
// accounting product type, so more entries can be added here as they come up.
const SALE_TYPE_OPTIONS = [
  { value: 'tokens', labelKey: 'manual_sale_type_tokens' },
] as const;

const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank', labelKey: 'manual_sale_payment_method_bank' },
  { value: 'card', labelKey: 'manual_sale_payment_method_card' },
  { value: 'crypto', labelKey: 'manual_sale_payment_method_crypto' },
  { value: 'cash', labelKey: 'manual_sale_payment_method_cash' },
  { value: 'third-party', labelKey: 'manual_sale_payment_method_third_party' },
  { value: 'other', labelKey: 'manual_sale_payment_method_other' },
] as const;

const STATUS_OPTIONS = [
  { value: 'paid', labelKey: 'token_sales_dashboard_paid' },
  { value: 'completed', labelKey: 'token_sales_dashboard_completed' },
  {
    value: 'pending-payment',
    labelKey: 'token_sales_dashboard_pending_payment',
  },
  { value: 'cancelled', labelKey: 'token_sales_dashboard_cancelled' },
] as const;

const PAID_STATUSES = ['paid', 'completed'];

interface ManualSaleModalProps {
  onClose: () => void;
  onCreated?: () => void | Promise<void>;
  defaultCurrency: string;
}

const ManualSaleModal = ({
  onClose,
  onCreated,
  defaultCurrency,
}: ManualSaleModalProps) => {
  const t = useTranslations();

  const [buyer, setBuyer] = useState<UserSearchResult | null>(null);
  const [saleType, setSaleType] = useState<string>(SALE_TYPE_OPTIONS[0].value);
  const [quantity, setQuantity] = useState('1');
  const [totalPrice, setTotalPrice] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [status, setStatus] = useState('paid');
  const [txHash, setTxHash] = useState('');
  const [message, setMessage] = useState('');
  const [createCharge, setCreateCharge] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);

  const quantityNum = Number(quantity);
  const totalPriceNum = Number(totalPrice);
  const isStatusPaid = PAID_STATUSES.includes(status);

  const unitPricePreview =
    Number.isFinite(quantityNum) &&
    quantityNum > 0 &&
    Number.isFinite(totalPriceNum) &&
    totalPrice !== ''
      ? Math.round((totalPriceNum / quantityNum) * 100) / 100
      : null;

  const isFormValid =
    Boolean(buyer?._id) &&
    Number.isFinite(quantityNum) &&
    quantityNum > 0 &&
    totalPrice !== '' &&
    Number.isFinite(totalPriceNum) &&
    totalPriceNum >= 0;

  const handleStatusChange = (nextStatus: string) => {
    setStatus(nextStatus);
    // A charge is what carries the sale into accounting, so it follows the
    // status unless the admin says the payment is already recorded elsewhere.
    setCreateCharge(PAID_STATUSES.includes(nextStatus));
  };

  const handleSubmit = async () => {
    if (!isFormValid || !buyer) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/sale/manual', {
        userId: buyer._id,
        product_type: saleType,
        quantity: quantityNum,
        total_price: totalPriceNum,
        paymentMethod,
        status,
        currency: currency.trim().toUpperCase() || undefined,
        ...(txHash.trim() ? { tx_hash: txHash.trim() } : {}),
        ...(message.trim() ? { message: message.trim() } : {}),
        createCharge,
      });
      setCreatedSaleId(data?.results?.saleId || '');
      await onCreated?.();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (createdSaleId !== null) {
    return (
      <Modal closeModal={onClose} className="md:w-[560px] md:max-w-[90vw]">
        <div className="space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {t('manual_sale_success_title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('manual_sale_success_description')}
          </p>
          {createdSaleId && (
            <p className="font-mono text-sm break-all">{createdSaleId}</p>
          )}
          <div className="flex justify-end">
            <Button onClick={onClose}>{t('generic_done')}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal closeModal={onClose} className="md:w-[600px] md:max-w-[90vw]">
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {t('manual_sale_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('manual_sale_description')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('manual_sale_user')}
            </label>
            <UserSearchInput
              selectedUser={buyer}
              onSelect={setBuyer}
              onClear={() => setBuyer(null)}
              placeholder={t('manual_sale_search_user')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('manual_sale_type')}
            </label>
            <Select value={saleType} onValueChange={setSaleType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('manual_sale_type')} />
              </SelectTrigger>
              <SelectContent>
                {SALE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('token_sales_dashboard_quantity')}
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                ariaLabel={t('token_sales_dashboard_quantity')}
                placeholder="1"
                className="w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('manual_sale_total_price')}
              </label>
              <Input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                ariaLabel={t('manual_sale_total_price')}
                placeholder="0"
                className="w-full px-3 py-2 text-sm"
              />
            </div>
          </div>

          {unitPricePreview !== null && (
            <p className="text-xs text-muted-foreground">
              {t('manual_sale_unit_price')}: {unitPricePreview} {currency}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('manual_sale_currency')}
              </label>
              <Input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                ariaLabel={t('manual_sale_currency')}
                placeholder={defaultCurrency}
                className="w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('manual_sale_payment_method')}
              </label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('manual_sale_payment_method')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t('token_sales_dashboard_status')}
              </label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t('token_sales_dashboard_status')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('manual_sale_tx_hash')}
            </label>
            <Input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              ariaLabel={t('manual_sale_tx_hash')}
              placeholder={t('manual_sale_tx_hash_placeholder')}
              className="w-full px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t('manual_sale_note')}
            </label>
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              ariaLabel={t('manual_sale_note')}
              placeholder={t('manual_sale_note_placeholder')}
              className="w-full px-3 py-2 text-sm"
            />
          </div>

          {isStatusPaid && (
            <Checkbox
              id="manual-sale-create-charge"
              isChecked={createCharge}
              onChange={() => setCreateCharge((checked) => !checked)}
              className="mb-0"
            >
              <span className="text-sm font-medium">
                {t('manual_sale_create_charge')}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {t('manual_sale_create_charge_hint')}
              </span>
            </Checkbox>
          )}
        </div>

        <div className="flex-shrink-0 pt-4 space-y-2">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              isEnabled={!isLoading}
            >
              {t('token_sales_dashboard_cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              isEnabled={isFormValid && !isLoading}
              isLoading={isLoading}
            >
              {t('manual_sale_submit')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ManualSaleModal;
