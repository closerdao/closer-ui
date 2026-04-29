import api, { formatSearch } from './api';

export interface SearchUserHit {
  _id: string;
  screenname: string;
  email?: string;
  walletAddress?: string;
}

function normalizeSearchUserResponse(data: unknown): SearchUserHit[] {
  if (data == null) {
    return [];
  }
  const raw = Array.isArray(data)
    ? data
    : typeof data === 'object' &&
        data !== null &&
        Array.isArray((data as Record<string, unknown>).results)
      ? (data as { results: unknown[] }).results
      : typeof data === 'object' &&
          data !== null &&
          Array.isArray((data as Record<string, unknown>).users)
        ? (data as { users: unknown[] }).users
        : [];
  const mapped: SearchUserHit[] = [];
  for (const u of raw) {
    if (!u || typeof u !== 'object' || !('_id' in u)) {
      continue;
    }
    const o = u as Record<string, unknown>;
    const id = String(o._id);
    if (!id) {
      continue;
    }
    mapped.push({
      _id: id,
      screenname:
        typeof o.screenname === 'string' && o.screenname.trim()
          ? o.screenname.trim()
          : id,
      email: typeof o.email === 'string' ? o.email : undefined,
      walletAddress:
        typeof o.walletAddress === 'string' ? o.walletAddress : undefined,
    });
  }
  return mapped;
}

export async function fetchUsersBySearchQuery(
  query: string,
): Promise<SearchUserHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }
  const { data } = await api.get('/user', {
    params: {
      where: formatSearch({ _search: trimmed }),
      sort_by: '-created',
      limit: 10,
    },
  });
  return normalizeSearchUserResponse(data);
}
