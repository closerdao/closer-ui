import { Village } from '../types/village';
import { applicationToVillage } from './villageApplication.utils';

const STORAGE_KEY = 'closer:application-answers';

/**
 * What the applicant typed into the "apply to join" modal, kept on their device
 * so /village/launch can open pre-filled once they have signed up and
 * subscribed. `_id` is the created application when the API returned one, which
 * is what lets the village link back to it via `applicationId`.
 */
export type StoredApplicationAnswers = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  fields?: Record<string, string>;
};

export const saveApplicationAnswers = (answers: StoredApplicationAnswers) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {}
};

export const readApplicationAnswers = (): StoredApplicationAnswers | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredApplicationAnswers;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearApplicationAnswers = () => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
};

/**
 * The stored answers as the `initial` a `VillageForm` opens on. Reuses the
 * dashboard's application→village mapping, minus the `applicationId` when the
 * API never told us the application's id.
 */
export const storedApplicationToVillageInitial = (
  stored: StoredApplicationAnswers,
): Partial<Village> => {
  const village = applicationToVillage({ ...stored, _id: stored._id || '' });
  if (!stored._id) delete village.applicationId;
  return village;
};
