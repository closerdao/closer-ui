import type { InteractionLiveRow, InteractionUserRef } from '../types/interaction';

export function interactionUserId(row: InteractionLiveRow): string | null {
  const u = row.user;
  if (typeof u === 'string' && u.length > 0) return u;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const id = (u as { _id?: string })._id;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  const legacy = row.createdBy;
  if (typeof legacy === 'string' && legacy.length > 0) return legacy;
  return null;
}

export function embeddedUserFromInteraction(
  row: InteractionLiveRow,
): InteractionUserRef | null {
  const u = row.user;
  if (u && typeof u === 'object' && !Array.isArray(u)) {
    const o = u as {
      _id?: string;
      screenname?: string;
      email?: string;
      photo?: string;
      slug?: string;
      timezone?: string;
      lastactive?: string;
    };
    if (o.screenname || o.email || o.photo || o.slug) return u as InteractionUserRef;
  }
  return null;
}

export function formatUtmBrief(utm: unknown): string | null {
  if (!utm || typeof utm !== 'object' || Array.isArray(utm)) return null;
  const parts: string[] = [];
  for (const [k, v] of Object.entries(utm as Record<string, unknown>)) {
    if (v === undefined || v === null || v === '') continue;
    parts.push(`${k}: ${String(v)}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

export function formatGeoBrief(geo: unknown): string | null {
  if (!geo || typeof geo !== 'object' || Array.isArray(geo)) return null;
  const g = geo as Record<string, unknown>;
  const city = typeof g.city === 'string' ? g.city : '';
  const region = typeof g.region === 'string' ? g.region : '';
  const country =
    typeof g.country === 'string'
      ? g.country
      : typeof g.countryCode === 'string'
        ? g.countryCode
        : '';
  const line = [city, region, country].filter(Boolean).join(', ');
  return line || null;
}

export function signalsKeyCount(signals: unknown): number {
  if (!signals || typeof signals !== 'object' || Array.isArray(signals)) return 0;
  return Object.keys(signals as object).length;
}

export function subscriberIdBrief(sub: unknown): string | null {
  if (typeof sub === 'string' && sub.length > 0) return sub;
  if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
    const id = (sub as { _id?: string })._id;
    if (typeof id === 'string' && id.length > 0) return id;
  }
  return null;
}
