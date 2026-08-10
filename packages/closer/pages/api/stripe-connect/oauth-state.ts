import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import { STRIPE_CONNECT_OAUTH_STATE_COOKIE } from '../../../constants/shared.constants';

const MAX_AGE_SEC = 600;

type SuccessBody = { state: string };
type ErrorBody = { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const isProd = process.env.NODE_ENV === 'production';
  const cookieSegments = [
    `${STRIPE_CONNECT_OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SEC}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isProd) {
    cookieSegments.push('Secure');
  }
  res.setHeader('Set-Cookie', cookieSegments.join('; '));
  return res.status(200).json({ state });
}
