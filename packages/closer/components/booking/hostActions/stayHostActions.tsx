import { useTranslations } from 'next-intl';

import type { Stay } from '../../../types/stay';
import HostActionsMenu, { HostActionItem } from './hostActionsMenu';
import HostChangeHistoryModal from './hostChangeHistoryModal';
import SetStatusAction from './setStatusAction';

// Record payment, Adjust amount, Sync with Stripe and Notes join this list as their tickets land.
export type HostActionId = 'set-status' | 'history';

interface Props {
  stayId: string;
  status: string;
  openAction: HostActionId | null;
  onOpenActionChange: (action: HostActionId | null) => void;
  /** After a change: refresh the stay and its change log. */
  onStayChange: (stay: Stay) => void | Promise<void>;
}

const StayHostActions = ({
  stayId,
  status,
  openAction,
  onOpenActionChange,
  onStayChange,
}: Props) => {
  const t = useTranslations();
  const close = () => onOpenActionChange(null);

  const items: HostActionItem[] = [
    {
      id: 'set-status',
      label: t('host_actions_set_status'),
      onSelect: () => onOpenActionChange('set-status'),
    },
    {
      id: 'history',
      label: t('host_actions_history'),
      onSelect: () => onOpenActionChange('history'),
    },
  ];

  return (
    <>
      <HostActionsMenu items={items} />
      {openAction === 'set-status' && (
        <SetStatusAction
          stayId={stayId}
          status={status}
          onDone={onStayChange}
          onClose={close}
        />
      )}
      {openAction === 'history' && (
        <HostChangeHistoryModal stayId={stayId} onClose={close} />
      )}
    </>
  );
};

export default StayHostActions;
