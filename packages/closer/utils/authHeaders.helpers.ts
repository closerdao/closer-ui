import type { NextApiRequest } from 'next';

export function getBearerAuthHeaders(req?: NextApiRequest) {
  const token = req?.cookies?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}
