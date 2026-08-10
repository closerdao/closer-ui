import type { NextApiRequest, NextApiResponse } from 'next';

type SuccessBody = { stripeUserId: string };
type ErrorBody = { error: string };

type StripeTokenResponse = {
  stripe_user_id?: string;
  error?: string;
  error_description?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.PLATFORM_STRIPE_SECRET_KEY;
  if (!secret) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const rawCode = req.body?.code;
  const code = typeof rawCode === 'string' ? rawCode : null;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);

  const stripeRes = await fetch('https://connect.stripe.com/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${secret}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = (await stripeRes.json()) as StripeTokenResponse;

  if (!stripeRes.ok || !data.stripe_user_id) {
    const message =
      data.error_description ?? data.error ?? 'Token exchange failed';
    return res.status(400).json({ error: message });
  }

  return res.status(200).json({ stripeUserId: data.stripe_user_id });
}
