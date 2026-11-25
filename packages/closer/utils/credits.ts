import api, { formatSearch } from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '12.5a';

type AwardBatchInput = Parameters<typeof trpc.credit.awardBatch.mutate>[0];
type ClaimInput = Parameters<typeof trpc.credit.claimOnboarding.mutate>[0];

export type ReferralCredit = { amount: number };

// Legacy `GET /credits/balance`; `cache: false` skips the GET cache as the stays flow did.
export const fetchCreditsBalance = async ({
  cache,
}: { cache?: false } = {}): Promise<unknown> => {
  if (!isTrpcEnabled(GROUP)) {
    const res =
      cache === false
        ? await api.get('/credits/balance', { cache } as any)
        : await api.get('/credits/balance');
    return res.data.results;
  }
  return trpc.credit.balance.query().catch(throwApiError);
};

// Legacy `POST /credits/availability`; `startDate` may be a Date.
export const fetchCreditsAvailability = async (input: {
  startDate: string | Date;
  creditsAmount: number;
  minCreditsAmount: number;
}): Promise<boolean> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/credits/availability', input);
    return Boolean(res.data?.results);
  }
  return trpc.credit.availability
    .mutate({ ...input, startDate: new Date(input.startDate).toISOString() })
    .catch(throwApiError);
};

// Legacy `POST /credits/claim/onboarding`; resolves to the response's `results`.
export const claimOnboardingCredits = async (
  input: ClaimInput,
): Promise<Record<string, unknown> | undefined> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.post('/credits/claim/onboarding', input);
    return res.data?.results;
  }
  return trpc.credit.claimOnboarding.mutate(input).catch(throwApiError);
};

// Legacy `POST /credits/award/batch`.
export const awardCreditsBatch = async (
  input: AwardBatchInput,
): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.post('/credits/award/batch', input);
    return;
  }
  await trpc.credit.awardBatch.mutate(input).catch(throwApiError);
};

// Legacy `GET /credit` with `{ userId, source: 'referral' }`, optionally within a `created` range.
export const fetchReferralCredits = async (
  userId: string,
  created?: { from: string; to: string },
): Promise<ReferralCredit[]> => {
  if (!isTrpcEnabled(GROUP)) {
    const res = await api.get('/credit', {
      params: {
        where: formatSearch({
          userId,
          source: 'referral',
          ...(created && { created: { $gte: created.from, $lte: created.to } }),
        }),
      },
    });
    return res.data.results;
  }
  const results = await trpc.credit.list
    .query({
      userId,
      source: 'referral',
      ...(created && { createdFrom: created.from, createdTo: created.to }),
    })
    .catch(throwApiError);
  // A credit the caller cannot read comes back as `{}`.
  return results.filter(
    (row): row is Extract<typeof row, { amount?: unknown }> & ReferralCredit =>
      'amount' in row,
  );
};
