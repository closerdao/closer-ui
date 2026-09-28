import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { FIELD_CONTROL_CLASS } from '../../../constants/formStyles';
import type { PriceLock, Stay } from '../../../types/stay';
import { adjustStayFiat, formatStayMoney } from '../../../utils/stays.api';
import HostReasonModal from './hostReasonModal';

type Direction = 'waive' | 'add';

interface Props {
  stayId: string;
  priceLock: PriceLock;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const AdjustAmountAction = ({ stayId, priceLock, onDone, onClose }: Props) => {
  const t = useTranslations();
  const [direction, setDirection] = useState<Direction>('waive');
  const [amount, setAmount] = useState('');
  const value = Number(amount);
  const isValid = amount !== '' && Number.isFinite(value) && value > 0;
  const current = priceLock.lines.adjustment;

  return (
    <HostReasonModal
      title={t('host_actions_adjust_amount')}
      canSubmit={isValid}
      onClose={onClose}
      onSubmit={async (reason) => {
        const delta = direction === 'waive' ? -value : value;
        await onDone(await adjustStayFiat(stayId, delta, reason));
      }}
    >
      <p className="text-sm">
        {t('host_actions_adjust_amount_total', {
          total: formatStayMoney(priceLock.total),
        })}
        {current?.val
          ? ` ${t('host_actions_adjust_amount_current', {
              amount: formatStayMoney(current),
            })}`
          : null}
      </p>
      <label
        className="flex flex-col gap-1 text-sm"
        htmlFor="host-adjust-direction"
      >
        <span className="font-medium">
          {t('host_actions_adjust_amount_direction')}
        </span>
        <select
          id="host-adjust-direction"
          className={FIELD_CONTROL_CLASS}
          value={direction}
          onChange={(event) => setDirection(event.target.value as Direction)}
        >
          <option value="waive">{t('host_actions_adjust_amount_waive')}</option>
          <option value="add">{t('host_actions_adjust_amount_add')}</option>
        </select>
      </label>
      <label
        className="flex flex-col gap-1 text-sm"
        htmlFor="host-adjust-amount"
      >
        <span className="font-medium">
          {t('host_actions_adjust_amount_label', { cur: priceLock.total.cur })}
        </span>
        <input
          id="host-adjust-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          className={FIELD_CONTROL_CLASS}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <p className="text-xs text-disabled">
        {t('host_actions_adjust_amount_note')}
      </p>
    </HostReasonModal>
  );
};

export default AdjustAmountAction;
