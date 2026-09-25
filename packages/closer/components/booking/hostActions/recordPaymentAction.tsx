import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { FIELD_CONTROL_CLASS } from '../../../constants/formStyles';
import {
  Charge,
  OFF_PLATFORM_CHARGE_METHODS,
  OffPlatformChargeMethod,
} from '../../../types/booking';
import type { Stay } from '../../../types/stay';
import { formatBookingLedgerChargeDisplay } from '../../../utils/bookingChargesLedger.helpers';
import { fetchAllCharges } from '../../../utils/chargePages';
import {
  recordStayPayment,
  reverseStayPayment,
} from '../../../utils/stays.api';
import { reversibleOffPlatformCharges } from './hostChangeLog.helpers';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const RecordPaymentAction = ({ stayId, onDone, onClose }: Props) => {
  const t = useTranslations();
  const [offPlatformCharges, setOffPlatformCharges] = useState<Charge[]>([]);
  const reversible = reversibleOffPlatformCharges(offPlatformCharges);
  // Set once the POST succeeds: from then on a retry would record the money twice.
  const [isRecorded, setIsRecorded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllCharges({
      linkedObjectType: 'Booking',
      linkedObjectId: stayId,
      method: { $in: OFF_PLATFORM_CHARGE_METHODS },
      status: { $in: ['paid', 'refunded'] },
    })
      .then((rows) => {
        if (!cancelled) setOffPlatformCharges(rows);
      })
      .catch(() => {
        if (!cancelled) setOffPlatformCharges([]);
      });
    return () => {
      cancelled = true;
    };
  }, [stayId]);
  const [mode, setMode] = useState<'record' | 'reverse'>('record');
  const [method, setMethod] = useState<OffPlatformChargeMethod>('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [chargeId, setChargeId] = useState('');

  const amountVal = Number(amount);
  const canSubmit =
    !isRecorded &&
    (mode === 'record'
      ? Number.isFinite(amountVal) && amountVal > 0
      : Boolean(chargeId));

  return (
    <HostReasonModal
      title={t('host_actions_record_payment')}
      canSubmit={canSubmit}
      onClose={onClose}
      onSubmit={async (reason) => {
        const stay =
          mode === 'record'
            ? await recordStayPayment(stayId, {
                method,
                amount: amountVal,
                ...(reference.trim() && { reference: reference.trim() }),
                reason,
              })
            : await reverseStayPayment(stayId, chargeId, reason);
        setIsRecorded(true);
        try {
          await onDone(stay);
        } catch {
          throw new Error(t('host_actions_record_payment_refresh_failed'));
        }
      }}
    >
      {reversible.length > 0 && (
        <label className="flex flex-col gap-1 text-sm" htmlFor="payment-mode">
          <span className="font-medium">
            {t('host_actions_record_payment_mode')}
          </span>
          <select
            id="payment-mode"
            className={FIELD_CONTROL_CLASS}
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as 'record' | 'reverse')
            }
          >
            <option value="record">
              {t('host_actions_record_payment_mode_record')}
            </option>
            <option value="reverse">
              {t('host_actions_record_payment_mode_reverse')}
            </option>
          </select>
        </label>
      )}
      {mode === 'record' ? (
        <>
          <label
            className="flex flex-col gap-1 text-sm"
            htmlFor="payment-method"
          >
            <span className="font-medium">
              {t('host_actions_record_payment_method')}
            </span>
            <select
              id="payment-method"
              className={FIELD_CONTROL_CLASS}
              value={method}
              onChange={(event) =>
                setMethod(event.target.value as OffPlatformChargeMethod)
              }
            >
              {OFF_PLATFORM_CHARGE_METHODS.map((option) => (
                <option key={option} value={option}>
                  {t(`charge_method_${option.replace('-', '_')}`)}
                </option>
              ))}
            </select>
          </label>
          <label
            className="flex flex-col gap-1 text-sm"
            htmlFor="payment-amount"
          >
            <span className="font-medium">
              {t('host_actions_record_payment_amount')}
            </span>
            <input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={FIELD_CONTROL_CLASS}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <div className="flex flex-col gap-1 text-sm">
            <label className="font-medium" htmlFor="payment-reference">
              {t('host_actions_record_payment_reference')}
            </label>
            <input
              id="payment-reference"
              aria-describedby="payment-reference-hint"
              className={FIELD_CONTROL_CLASS}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
            <p id="payment-reference-hint" className="text-xs text-disabled">
              {t('host_actions_record_payment_reference_hint')}
            </p>
          </div>
        </>
      ) : (
        <label
          className="flex flex-col gap-1 text-sm"
          htmlFor="payment-to-reverse"
        >
          <span className="font-medium">
            {t('host_actions_record_payment_to_reverse')}
          </span>
          <select
            id="payment-to-reverse"
            className={FIELD_CONTROL_CLASS}
            value={chargeId}
            onChange={(event) => setChargeId(event.target.value)}
          >
            <option value="" disabled />
            {reversible.map((charge) => (
              <option key={charge._id} value={charge._id}>
                {dayjs(charge.date).format('DD/MM/YYYY')} ·{' '}
                {t(`charge_method_${charge.method.replace('-', '_')}`)} ·{' '}
                {formatBookingLedgerChargeDisplay(charge)}
              </option>
            ))}
          </select>
        </label>
      )}
    </HostReasonModal>
  );
};

export default RecordPaymentAction;
