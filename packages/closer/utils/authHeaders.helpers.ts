import type { NextApiRequest } from 'next';

export function getBearerToken(req?: NextApiRequest): string | undefined {
  return req?.cookies?.access_token;
}

export function getBearerAuthHeaders(req?: NextApiRequest) {
  const token = getBearerToken(req);
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}
