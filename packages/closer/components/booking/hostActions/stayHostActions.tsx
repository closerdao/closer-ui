import { useTranslations } from 'next-intl';

import type { PriceLock, Stay } from '../../../types/stay';
import AdjustAmountAction from './adjustAmountAction';
import ClearHoldAction from './clearHoldAction';
import DoNotAutoCancelAction from './doNotAutoCancelAction';
import HostActionsMenu, { HostActionItem } from './hostActionsMenu';
import HostChangeHistoryModal from './hostChangeHistoryModal';
import NotesAction from './notesAction';
import RecordPaymentAction from './recordPaymentAction';
import SetStatusAction from './setStatusAction';
import SyncStripeAction from './syncStripeAction';
import UnstakedNightsAction from './unstakedNightsAction';

export type HostActionId =
  | 'set-status'
  | 'adjust-fiat'
  | 'unstaked-nights'
  | 'do-not-auto-cancel'
  | 'record-payment'
  | 'notes'
  | 'sync-stripe'
  | 'clear-hold'
  | 'history';

interface Props {
  stayId: string;
  status: string;
  /** Offers Clear stuck hold only while a change is stuck settling. */
  pendingModificationStatus?: string;
  /** Absent on a legacy stay, which has nothing to adjust. */
  priceLock?: PriceLock;
  openAction: HostActionId | null;
  onOpenActionChange: (action: HostActionId | null) => void;
  /** After a change: refresh the stay and its change log. */
  onStayChange: (stay?: Stay) => void | Promise<void>;
}

const StayHostActions = ({
  stayId,
  status,
  pendingModificationStatus,
  priceLock,
  openAction,
  onOpenActionChange,
  onStayChange,
}: Props) => {
  const t = useTranslations();
  const close = () => onOpenActionChange(null);
  const unstakedNights = priceLock?.lines.adjustment?.unstakedNights;

  const items: HostActionItem[] = [
    {
      id: 'set-status',
      label: t('host_actions_set_status'),
      onSelect: () => onOpenActionChange('set-status'),
    },
    ...(priceLock
      ? [
          {
            id: 'adjust-fiat',
            label: t('host_actions_adjust_amount'),
            onSelect: () => onOpenActionChange('adjust-fiat'),
          },
        ]
      : []),
    ...(unstakedNights
      ? [
          {
            id: 'unstaked-nights',
            label: t('host_actions_unstaked_nights'),
            onSelect: () => onOpenActionChange('unstaked-nights'),
          },
        ]
      : []),
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
      id: 'record-payment',
      label: t('host_actions_record_payment'),
      onSelect: () => onOpenActionChange('record-payment'),
    },
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
      {openAction === 'adjust-fiat' && priceLock && (
        <AdjustAmountAction
          stayId={stayId}
          priceLock={priceLock}
          onDone={onStayChange}
          onClose={close}
        />
      )}
      {openAction === 'unstaked-nights' && unstakedNights && (
        <UnstakedNightsAction
          stayId={stayId}
          unstakedNights={unstakedNights}
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
      {openAction === 'record-payment' && (
        <RecordPaymentAction
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
