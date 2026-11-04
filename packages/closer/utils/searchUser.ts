import { fetchUsers } from './users';

export interface SearchUserHit {
  _id: string;
  screenname: string;
  email?: string;
  photo?: string;
  walletAddress?: string;
}

function normalizeSearchUserResponse(
  raw: unknown[] | null | undefined,
): SearchUserHit[] {
  if (!Array.isArray(raw)) {
    return [];
  }
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
      photo: typeof o.photo === 'string' ? o.photo : undefined,
      walletAddress:
        typeof o.walletAddress === 'string' ? o.walletAddress : undefined,
    });
  }
  return mapped;
}

export async function fetchUsersBySearchQuery(
  query: string,
  limit = 10,
): Promise<SearchUserHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }
  const results = await fetchUsers({
    where: { _search: trimmed },
    sort_by: '-created',
    limit,
  });
  return normalizeSearchUserResponse(results);
}
