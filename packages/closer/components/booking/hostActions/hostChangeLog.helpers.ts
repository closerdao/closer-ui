import type { HostChangeEntry, StayStatus } from '../../../types/stay';

// Mirrors closer-api utils/stays/status.js without paid, which only recorded payments set; the server still decides.
const HOST_SETTABLE_STATUSES: Partial<Record<StayStatus, StayStatus[]>> = {
  draft: ['pending', 'confirmed', 'cancelled'],
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['pending-payment', 'pending', 'cancelled'],
  'pending-payment': ['confirmed', 'cancelled'],
  paid: ['pending-payment', 'cancelled'],
  'tokens-staked': ['pending-payment', 'cancelled'],
  'credits-paid': ['pending-payment', 'cancelled'],
};

export const hostSettableStatuses = (from?: string): StayStatus[] =>
  HOST_SETTABLE_STATUSES[from as StayStatus] ?? [];

export const formatStatus = (status: string) => status.replace(/-/g, ' ');

const ACTION_LABEL_KEYS: Record<string, string> = {
  'set-status': 'host_actions_set_status',
  'edit-guest-note': 'host_change_action_edit_guest_note',
};

export const hostChangeActionLabel = (
  action: string,
  t: (key: string) => string,
) => (ACTION_LABEL_KEYS[action] ? t(ACTION_LABEL_KEYS[action]) : action);

const display = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '—';
  return typeof value === 'string' ? value : JSON.stringify(value);
};

/** "status: confirmed → cancelled", one line per field the entry changed. */
export const describeHostChange = (entry: HostChangeEntry): string[] => {
  const fields = Object.keys({ ...entry.before, ...entry.after });
  return fields.map((field) => {
    const before = display(entry.before?.[field]);
    const after = display(entry.after?.[field]);
    return field === 'status'
      ? `${field}: ${formatStatus(before)} → ${formatStatus(after)}`
      : `${field}: ${before} → ${after}`;
  });
};
