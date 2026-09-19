import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  STRIPE_CONNECT_OAUTH_RETURN_TO_COOKIE,
  STRIPE_CONNECT_OAUTH_STATE_COOKIE,
} from '../../../constants/shared.constants';
import { resolveStripeConnectReturnTo } from '../../../utils/stripeConnectReturnTo';

const MAX_AGE_SEC = 600;

type SuccessBody = { state: string };
type ErrorBody = { error: string };

const buildCookie = (name: string, value: string, isProd: boolean): string => {
  const cookieSegments = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${MAX_AGE_SEC}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (isProd) {
    cookieSegments.push('Secure');
  }
  return cookieSegments.join('; ');
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const isProd = process.env.NODE_ENV === 'production';
  const returnTo = resolveStripeConnectReturnTo(
    typeof req.body?.returnTo === 'string' ? req.body.returnTo : undefined,
  );

  res.setHeader('Set-Cookie', [
    buildCookie(STRIPE_CONNECT_OAUTH_STATE_COOKIE, state, isProd),
    buildCookie(STRIPE_CONNECT_OAUTH_RETURN_TO_COOKIE, returnTo, isProd),
  ]);
  return res.status(200).json({ state });
}
