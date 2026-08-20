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
// The confetti burst finishes on its own; the overlay stays until dismissed.
export const PROPOSAL_RESULT_CELEBRATION_DURATION_MS = 3200;

interface ProposalResultCelebrationProps {
  proposalId: string;
  endDate?: string;
  effectiveStatus: EffectiveProposalStatus;
  forceShow?: boolean;
  isFinalized?: boolean;
}

const ProposalResultCelebration = ({
  proposalId,
  endDate,
  effectiveStatus,
  forceShow = false,
  isFinalized = false,
}: ProposalResultCelebrationProps) => {
  const t = useTranslations();
  const [show, setShow] = useState(false);
  const isPassed = isFinalized && effectiveStatus === 'passed';
  const isFailed = isFinalized && effectiveStatus === 'failed';

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShow(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
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
        role="dialog"
        aria-modal="true"
        aria-label={
          isPassed
            ? t('governance_result_passed_title')
            : t('governance_result_failed_title')
        }
        onClick={() => setShow(false)}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 px-4"
        style={{
          opacity: show ? 1 : 0,
          pointerEvents: show ? 'auto' : 'none',
          transition: `opacity ${OVERLAY_FADE_MS}ms ease-out`,
        }}
      >
        <button
          type="button"
          aria-label={t('governance_result_close')}
          onClick={() => setShow(false)}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-foreground"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
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
        <button
          type="button"
          onClick={() => setShow(false)}
          className="mt-8 rounded-full bg-accent px-6 py-2 text-sm font-medium text-white"
        >
          {t('governance_result_close')}
        </button>
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
