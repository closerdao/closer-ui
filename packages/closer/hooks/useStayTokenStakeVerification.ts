import { useEffect, useRef, useState } from 'react';

import type { Stay, StayTokenStakePlan } from '../types/stay';
import type { PendingStayTokenStake } from '../types/stayTokenStake';
import {
  clearPendingStayTokenStake,
  readPendingStayTokenVerification,
  stayTokenStakePlanKey,
  writePendingStayTokenVerification,
} from '../utils/stayTokenStakePendingStorage';
import {
  STAKE_VERIFICATION_REQUEST_TIMEOUT_MS,
  isStakeVerificationAborted,
  stakeVerificationDelayedError,
  verifyStayTokenStake,
} from '../utils/stayTokenStakeVerification';
import { computeTokensOwed, getStay } from '../utils/stays.api';

type VerificationResult = { booking: Stay; verified: true };
type Attempt = {
  controller: AbortController;
  promise: Promise<VerificationResult>;
};

// Owns only the post-transaction API work. Wallet requests remain in the
// staking runner; this hook can recover even with the wallet disconnected.
export const useStayTokenStakeVerification = (
  stayId: string,
  plan: StayTokenStakePlan | null,
) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [record, setRecord] = useState<{
    stayId: string;
    pending: PendingStayTokenStake;
  } | null>(null);
  const active = useRef<Attempt | null>(null);
  const scope = useRef<{ stayId: string; planKey: string | null } | null>(null);
  const planKey = plan ? stayTokenStakePlanKey(plan) : null;
  const pendingVerification =
    record?.stayId === stayId && record.pending.planKey === planKey
      ? record.pending
      : readPendingStayTokenVerification(stayId, plan);

  useEffect(() => {
    scope.current = { stayId, planKey };
    setIsVerifying(false);
    return () => {
      scope.current = null;
      active.current?.controller.abort();
      active.current = null;
    };
  }, [stayId, planKey]);

  const verifyStake = (
    planToVerify: StayTokenStakePlan,
    transactionId: string,
  ): Promise<VerificationResult> => {
    if (active.current) return active.current.promise;
    const wasPending =
      pendingVerification ||
      readPendingStayTokenVerification(stayId, planToVerify);
    const pending = writePendingStayTokenVerification(
      stayId,
      transactionId,
      planToVerify,
    );
    // Wallet approval can finish after navigation. Keep its confirmed hash,
    // but don't start background polling for a page or plan that was left.
    if (scope.current?.stayId !== stayId || scope.current.planKey !== planKey)
      return Promise.reject(
        new DOMException('Verification stopped.', 'AbortError'),
      );
    setRecord({ stayId, pending });
    setIsVerifying(true);
    const controller = new AbortController();
    const attempt = { controller } as Attempt;
    active.current = attempt;

    attempt.promise = (async () => {
      let booking: Stay | undefined;
      let recovery = false;
      try {
        // A previous response may have been lost after the server recorded the
        // stake. Refresh before a manual retry instead of assuming it failed.
        if (wasPending) {
          const fresh = await getStay(stayId, {
            signal: controller.signal,
            timeout: STAKE_VERIFICATION_REQUEST_TIMEOUT_MS,
          });
          if (computeTokensOwed(fresh) === 0) {
            // Deliver retained references even if another check already recorded payment.
            if (pending.transactionIds?.length) recovery = true;
            else booking = fresh;
          }
        }
        if (!booking) {
          booking = (
            await verifyStayTokenStake(
              stayId,
              transactionId,
              controller.signal,
              {
                ...(pending.transactionIds?.length && {
                  transactionIds: pending.transactionIds,
                }),
                ...(recovery && { recovery }),
              },
            )
          ).booking;
        }
        if (controller.signal.aborted)
          throw new DOMException('Verification stopped.', 'AbortError');
        clearPendingStayTokenStake(stayId);
        setRecord(null);
        return { booking, verified: true };
      } catch (error: any) {
        if (controller.signal.aborted || isStakeVerificationAborted(error))
          throw new DOMException('Verification stopped.', 'AbortError');
        if (error?.isAxiosError && !error.response)
          throw stakeVerificationDelayedError();
        throw error;
      } finally {
        if (active.current === attempt) {
          active.current = null;
          setIsVerifying(false);
        }
      }
    })();
    return attempt.promise;
  };

  return { isVerifying, pendingVerification, verifyStake };
};
