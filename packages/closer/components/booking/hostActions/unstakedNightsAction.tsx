import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { FIELD_CONTROL_CLASS } from '../../../constants/formStyles';
import type {
  Stay,
  UnstakedNights,
  UnstakedNightsDecision,
} from '../../../types/stay';
import {
  decideUnstakedNights,
  formatStakeNights,
  formatStayMoney,
} from '../../../utils/stays.api';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  unstakedNights: UnstakedNights;
  onDone: (stay: Stay) => void | Promise<void>;
  onClose: () => void;
}

const UnstakedNightsAction = ({
  stayId,
  unstakedNights,
  onDone,
  onClose,
}: Props) => {
  const t = useTranslations();
  const [decision, setDecision] = useState<UnstakedNightsDecision>(
    unstakedNights.waived ? 'owe' : 'waive',
  );

  return (
    <HostReasonModal
      title={t('host_actions_unstaked_nights')}
      onClose={onClose}
      onSubmit={async (reason) => {
        await onDone(await decideUnstakedNights(stayId, decision, reason));
      }}
    >
      <p className="text-sm">
        {t(
          unstakedNights.waived
            ? 'host_actions_unstaked_nights_waived'
            : 'host_actions_unstaked_nights_owed',
          {
            nights: formatStakeNights(unstakedNights.nights),
            amount: formatStayMoney(unstakedNights),
          },
        )}
      </p>
      <label
        className="flex flex-col gap-1 text-sm"
        htmlFor="host-unstaked-nights-decision"
      >
        <span className="font-medium">
          {t('host_actions_unstaked_nights_decision')}
        </span>
        <select
          id="host-unstaked-nights-decision"
          className={FIELD_CONTROL_CLASS}
          value={decision}
          onChange={(event) =>
            setDecision(event.target.value as UnstakedNightsDecision)
          }
        >
          <option value="waive">
            {t('host_actions_unstaked_nights_waive')}
          </option>
          <option value="owe">{t('host_actions_unstaked_nights_owe')}</option>
        </select>
      </label>
      <p className="text-xs text-disabled">
        {t('host_actions_unstaked_nights_note')}
      </p>
    </HostReasonModal>
  );
};

export default UnstakedNightsAction;
