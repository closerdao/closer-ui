import type { StayTokenStakePlan } from '../types/stay';
import {
  readPendingStayTokenStake,
  writePendingStayTokenStake,
} from './stayTokenStakePendingStorage';
import {
  listPastUnstakedNights,
  selectStayTokenStakeSubmission,
} from './stays.api';

export type StayTokenStakeTokensResult = {
  error?: unknown;
  success?: { transactionId?: string | null } | null;
} | null;

export type StayTokenStakeTokens = (
  pricePerNightWei: string,
  bookingNights: number[][],
  options: {
    completedNightCount: number;
    onProgress: (progress: {
      completedNightCount: number;
      transactionId: string | null;
    }) => void;
  },
) => Promise<StayTokenStakeTokensResult | undefined>;

export type StayTokenStakeRun = {
  result: StayTokenStakeTokensResult | undefined;
  /** Key of the last submitted batch, for recovering its stored transaction. */
  nightsKey: string;
  /** Nights of this plan on chain once the run stopped. */
  stakedNightCount: number;
  totalNightCount: number;
  /** Unstaked nights already past, which the contract would revert. */
  skippedNights: number[][];
};

const isStakedResult = (result: StayTokenStakeTokensResult | undefined) =>
  !!result && !result.error && !!result.success?.transactionId;

/**
 * Signs every night of the plan that is not staked yet, one transaction batch
 * per segment rate, and stops at the first batch that fails so the caller can
 * report how far the stake got rather than call a partial stake a success.
 */
export const stakeStayTokenPlan = async ({
  stayId,
  plan,
  stakedNightCount,
  stakeTokens,
  now = Date.now(),
}: {
  stayId: string;
  plan: StayTokenStakePlan;
  stakedNightCount: number;
  stakeTokens: StayTokenStakeTokens;
  now?: number;
}): Promise<StayTokenStakeRun> => {
  let cursor = Math.max(0, Math.floor(stakedNightCount) || 0);
  const skippedNights = listPastUnstakedNights(plan, cursor, now);
  const totalNightCount = plan.bookingNights.length - skippedNights.length;
  let staked = cursor;
  let nightsKey = JSON.stringify(plan.bookingNights);
  let lastResult: StayTokenStakeTokensResult | undefined;

  for (;;) {
    const submission = selectStayTokenStakeSubmission(plan, cursor, now);
    if (!submission) {
      return {
        result: lastResult ?? {
          error: null,
          success: { transactionId: 'existing' },
        },
        nightsKey,
        stakedNightCount: staked,
        totalNightCount,
        skippedNights,
      };
    }

    nightsKey = JSON.stringify(submission.bookingNights);
    const pendingProgress = readPendingStayTokenStake(stayId, nightsKey);
    let latestStoredTransactionId = pendingProgress?.transactionId || '';

    const result = await stakeTokens(
      submission.pricePerNightWei,
      submission.bookingNights,
      {
        completedNightCount: pendingProgress?.completedNightCount || 0,
        onProgress: ({ completedNightCount, transactionId }) => {
          if (transactionId) latestStoredTransactionId = transactionId;
          if (!latestStoredTransactionId) return;
          writePendingStayTokenStake(
            stayId,
            latestStoredTransactionId,
            nightsKey,
            completedNightCount,
          );
        },
      },
    );

    if (!isStakedResult(result)) {
      return {
        result,
        nightsKey,
        stakedNightCount: staked,
        totalNightCount,
        skippedNights,
      };
    }

    const transactionId = String(result?.success?.transactionId);
    if (transactionId !== 'existing') {
      writePendingStayTokenStake(
        stayId,
        transactionId,
        nightsKey,
        submission.bookingNights.length,
      );
    }
    staked += submission.bookingNights.length;
    cursor = submission.stakedNightCountAfter;
    lastResult = result;
  }
};
