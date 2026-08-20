import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  EffectiveProposalStatus,
  hasSeenResultCelebration,
  isWithinResultCelebrationWindow,
  markResultCelebrationSeen,
} from 'closer/utils/proposalStatus';

import GovernanceConfetti from './GovernanceConfetti';

const OVERLAY_FADE_MS = 500;
export const PROPOSAL_RESULT_CELEBRATION_DURATION_MS = 3200;

interface ProposalResultCelebrationProps {
  proposalId: string;
  endDate?: string;
  effectiveStatus: EffectiveProposalStatus;
  forceShow?: boolean;
}

const ProposalResultCelebration = ({
  proposalId,
  endDate,
  effectiveStatus,
  forceShow = false,
}: ProposalResultCelebrationProps) => {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const isPassed = effectiveStatus === 'passed';
  const isFailed = effectiveStatus === 'failed';

  useEffect(() => {
    if (!isPassed && !isFailed) {
      return;
    }

    if (!endDate || !isWithinResultCelebrationWindow(endDate)) {
      return;
    }

    if (forceShow || !hasSeenResultCelebration(proposalId)) {
      setShow(true);
      markResultCelebrationSeen(proposalId);
    }
  }, [effectiveStatus, endDate, forceShow, isFailed, isPassed, proposalId]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShow(false);
    }, PROPOSAL_RESULT_CELEBRATION_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [show]);

  if (!show || (!isPassed && !isFailed)) {
    return null;
  }

  return (
    <>
      <GovernanceConfetti
        active={show}
        intensity={isPassed ? 1 : 0.6}
        variant={isPassed ? 'celebrate' : 'fail'}
        durationMs={PROPOSAL_RESULT_CELEBRATION_DURATION_MS}
      />
      <div
        aria-hidden
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 px-4"
        style={{
          opacity: show ? 1 : 0,
          pointerEvents: show ? 'auto' : 'none',
          transition: `opacity ${OVERLAY_FADE_MS}ms ease-out`,
        }}
      >
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            isPassed ? 'bg-success' : 'bg-gray-700'
          }`}
          style={{
            animation: show
              ? isPassed
                ? 'governance-result-pop 0.55s ease-out forwards'
                : 'governance-result-shake 0.7s ease-out forwards'
              : 'none',
          }}
        >
          {isPassed ? (
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="mt-6 max-w-md text-center text-2xl font-semibold text-foreground">
          {isPassed
            ? t('governance_result_passed_title')
            : t('governance_result_failed_title')}
        </h2>
        <p className="mt-2 max-w-md text-center text-sm text-gray-600">
          {isPassed
            ? t('governance_result_passed_description')
            : t('governance_result_failed_description')}
        </p>
      </div>
      <style jsx global>{`
        @keyframes governance-result-pop {
          0% {
            opacity: 0;
            transform: scale(0.35);
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes governance-result-shake {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translateX(-8px) scale(1);
          }
          40% {
            transform: translateX(8px) scale(1);
          }
          60% {
            transform: translateX(-6px) scale(1);
          }
          80% {
            transform: translateX(6px) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default ProposalResultCelebration;
