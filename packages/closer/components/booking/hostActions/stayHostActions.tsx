import { useTranslations } from 'next-intl';

import type { Stay } from '../../../types/stay';
import ClearHoldAction from './clearHoldAction';
import DoNotAutoCancelAction from './doNotAutoCancelAction';
import HostActionsMenu, { HostActionItem } from './hostActionsMenu';
import HostChangeHistoryModal from './hostChangeHistoryModal';
import NotesAction from './notesAction';
import SetStatusAction from './setStatusAction';
import SyncStripeAction from './syncStripeAction';

// Record payment and Adjust amount join this list as their tickets land.
export type HostActionId =
  | 'set-status'
  | 'do-not-auto-cancel'
  | 'notes'
  | 'sync-stripe'
  | 'clear-hold'
  | 'history';

interface Props {
  stayId: string;
  status: string;
  /** Offers Clear stuck hold only while a change is stuck settling. */
  pendingModificationStatus?: string;
  openAction: HostActionId | null;
  onOpenActionChange: (action: HostActionId | null) => void;
  /** After a change: refresh the stay and its change log. */
  onStayChange: (stay?: Stay) => void | Promise<void>;
}

const StayHostActions = ({
  stayId,
  status,
  pendingModificationStatus,
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
    ...(status === 'confirmed'
      ? [
          {
            id: 'do-not-auto-cancel',
            label: t('host_actions_do_not_auto_cancel'),
            onSelect: () => onOpenActionChange('do-not-auto-cancel'),
          },
        ]
      : []),
    {
      id: 'notes',
      label: t('host_note_title'),
      onSelect: () => onOpenActionChange('notes'),
    },
    {
      id: 'sync-stripe',
      label: t('host_actions_sync_stripe'),
      onSelect: () => onOpenActionChange('sync-stripe'),
    },
    ...(pendingModificationStatus === 'settling'
      ? [
          {
            id: 'clear-hold',
            label: t('host_actions_clear_hold'),
            onSelect: () => onOpenActionChange('clear-hold'),
          },
        ]
      : []),
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
      {openAction === 'do-not-auto-cancel' && (
        <DoNotAutoCancelAction
          stayId={stayId}
          onDone={onStayChange}
          onClose={close}
        />
      )}
      {openAction === 'notes' && (
        <NotesAction
          stayId={stayId}
          onDone={() => onStayChange()}
          onClose={close}
        />
      )}
      {openAction === 'sync-stripe' && (
        <SyncStripeAction
          stayId={stayId}
          onDone={onStayChange}
          onClose={close}
        />
      )}
      {openAction === 'clear-hold' && (
        <ClearHoldAction
          stayId={stayId}
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
