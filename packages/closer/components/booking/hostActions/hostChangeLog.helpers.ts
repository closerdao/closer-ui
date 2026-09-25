import {
  Charge,
  OFF_PLATFORM_CHARGE_METHODS,
  OffPlatformChargeMethod,
} from '../../../types/booking';
import type {
  HostChangeEntry,
  StayMoney,
  StayStatus,
} from '../../../types/stay';
import { formatStayMoney } from '../../../utils/stays.api';

// closer-api's status FSM minus paid and pending-payment, which only reconcileStay writes; the server still decides.
const HOST_SETTABLE_STATUSES: Partial<Record<StayStatus, StayStatus[]>> = {
  draft: ['pending', 'confirmed', 'cancelled'],
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['pending', 'cancelled'],
  'pending-payment': ['confirmed', 'cancelled'],
  paid: ['cancelled'],
  'tokens-staked': ['cancelled'],
  'credits-paid': ['cancelled'],
};

export const hostSettableStatuses = (from?: string): StayStatus[] =>
  HOST_SETTABLE_STATUSES[from as StayStatus] ?? [];

export const formatStatus = (status: string) => status.replace(/-/g, ' ');

const ACTION_LABEL_KEYS: Record<string, string> = {
  'set-status': 'host_actions_set_status',
  'adjust-fiat': 'host_actions_adjust_amount',
  'adjust-fiat-clamp': 'host_change_action_adjust_fiat_clamp',
  'edit-guest-note': 'host_change_action_edit_guest_note',
  'do-not-auto-cancel': 'host_actions_do_not_auto_cancel',
  'edit-host-note': 'host_change_action_edit_host_note',
  'settle-stripe': 'host_actions_sync_stripe',
  'clear-hold': 'host_actions_clear_hold',
  'record-payment': 'host_actions_record_payment',
  'reverse-payment': 'host_change_action_reverse_payment',
};

export const hostChangeActionLabel = (
  action: string,
  t: (key: string) => string,
) => (ACTION_LABEL_KEYS[action] ? t(ACTION_LABEL_KEYS[action]) : action);

const isMoney = (value: unknown): value is StayMoney =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as StayMoney).val === 'number' &&
  typeof (value as StayMoney).cur === 'string';

const display = (value: unknown) => {
  if (value === undefined || value === null || value === '') return '—';
  if (isMoney(value)) return formatStayMoney(value);
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

const isOffPlatform = (method: string) =>
  OFF_PLATFORM_CHARGE_METHODS.includes(method as OffPlatformChargeMethod);

/** Paid cash / bank-transfer charges that no refunded charge reverses yet. */
export const reversibleOffPlatformCharges = (charges: Charge[]): Charge[] => {
  const reversed = new Set(
    charges
      .filter((c) => c.status === 'refunded' && c.meta?.reversesChargeId)
      .map((c) => c.meta.reversesChargeId),
  );
  return charges.filter(
    (c) =>
      c.status === 'paid' &&
      isOffPlatform(c.method) &&
      !reversed.has(String(c._id)),
  );
};
