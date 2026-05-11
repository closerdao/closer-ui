import type {
  CohousingApplication,
  CohousingCosigner,
} from '../types/cohousingApplication';

export function getCosignerUserId(
  cosigner: CohousingCosigner | undefined | null,
): string | undefined {
  const raw = cosigner?.userId;
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string') {
    return raw;
  }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    '_id' in raw &&
    (raw as { _id?: unknown })._id != null
  ) {
    return String((raw as { _id: unknown })._id);
  }
  return undefined;
}

export function cohousingApplicationsFromGetAction(
  action: unknown,
): CohousingApplication[] {
  if (!action || typeof action !== 'object') {
    return [];
  }
  const results = (action as { results?: unknown }).results;
  let raw: unknown = results;
  if (
    results &&
    typeof results === 'object' &&
    'toJS' in results &&
    typeof (results as { toJS?: () => unknown }).toJS === 'function'
  ) {
    raw = (results as { toJS: () => unknown }).toJS();
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw as CohousingApplication[];
}

export function getPrimaryApplicantDisplayName(
  app: CohousingApplication,
): string {
  const intake = app.intake;
  if (intake?.fullName?.trim()) {
    return intake.fullName.trim();
  }
  const cb = app.createdBy;
  if (
    cb &&
    typeof cb === 'object' &&
    'screenname' in cb &&
    typeof (cb as { screenname?: string }).screenname === 'string'
  ) {
    const sn = (cb as { screenname: string }).screenname.trim();
    if (sn) {
      return sn;
    }
  }
  return app._id.slice(-8);
}
