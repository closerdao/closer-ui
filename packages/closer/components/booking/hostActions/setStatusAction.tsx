import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { FIELD_CONTROL_CLASS } from '../../../constants/formStyles';
import type { Stay, StayStatus } from '../../../types/stay';
import { setStayStatus } from '../../../utils/stays.api';
import { formatStatus, hostSettableStatuses } from './hostChangeLog.helpers';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  status: string;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const SetStatusAction = ({ stayId, status, onDone, onClose }: Props) => {
  const t = useTranslations();
  const targets = hostSettableStatuses(status);
  const [target, setTarget] = useState<StayStatus | ''>('');

  return (
    <HostReasonModal
      title={t('host_actions_set_status')}
      canSubmit={Boolean(target)}
      onClose={onClose}
      onSubmit={async (reason) => {
        if (!target) return;
        await onDone(await setStayStatus(stayId, status, target, reason));
      }}
    >
      {targets.length ? (
        <label className="flex flex-col gap-1 text-sm" htmlFor="host-status">
          <span className="font-medium">
            {t('host_actions_set_status_label')}
          </span>
          <select
            id="host-status"
            className={FIELD_CONTROL_CLASS}
            value={target}
            onChange={(event) => setTarget(event.target.value as StayStatus)}
          >
            <option value="" disabled>
              {formatStatus(status)}
            </option>
            {targets.map((option) => (
              <option key={option} value={option}>
                {formatStatus(option)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="text-sm">
          {t('host_actions_set_status_none', { status: formatStatus(status) })}
        </p>
      )}
      <p className="text-xs text-disabled">
        {t('host_actions_set_status_paid_note')}
      </p>
    </HostReasonModal>
  );
};

export default SetStatusAction;
