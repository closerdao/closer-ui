import { useCallback, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { CohousingApplication } from '../../types/cohousingApplication';
import Button from '../ui/Button';
import { CohousingAgreementModal } from './cohousingAgreementModal';
import {
  COHOUSING_DEFAULT_COMMITTED,
  CohousingLandingHero,
} from './cohousingLandingHero';
import { FlowProgressBar } from './cohousingFlowUi';
import { CohousingVerticalTimeline } from './cohousingTimeline';

const clampStep = (n: number) => Math.min(Math.max(Math.floor(n), 1), 14);
const getEffectiveStep = (application: CohousingApplication) => {
  if (application.status === 'waitlist') {
    return 1;
  }
  return clampStep(application.currentStep ?? 1);
};

export const CohousingParticipantView = ({
  application,
  onPersist,
}: {
  application: CohousingApplication;
  onPersist: (data: Record<string, unknown>) => Promise<void>;
}) => {
  const t = useTranslations();
  const step = getEffectiveStep(application);
  const [started, setStarted] = useState(() => step > 1);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [committed, setCommitted] = useState(COHOUSING_DEFAULT_COMMITTED);
  const [mode, setMode] = useState<string | null>(
    application.financingMode ?? null,
  );
  const submittedSteps = new Set(
    (application.stepHistory || [])
      .filter((entry) => entry?.event === 'participant_submitted')
      .map((entry) => Number(entry?.step))
      .filter((entry) => Number.isFinite(entry)),
  );
  const currentStepSubmitted = submittedSteps.has(step);
  const quizDraftStorageKey = `cohousing:tdf-quiz:${application._id}`;
  const quizInitialAnswers =
    application.quiz && typeof (application.quiz as Record<string, unknown>).answers === 'object'
      ? ((application.quiz as Record<string, unknown>).answers as Record<string, string>)
      : undefined;

  const handlePersist = useCallback(
    async (data: Record<string, unknown>) => {
      await onPersist(data);
    },
    [onPersist],
  );

  const handleAdvance = useCallback(async () => {
    const next = Math.min(step + 1, 14);
    await handlePersist({ currentStep: next });
  }, [handlePersist, step]);

  const handleMode = useCallback(
    async (m: string) => {
      setMode(m);
      await handlePersist({ financingMode: m });
    },
    [handlePersist],
  );

  const handlePoolAdd = useCallback((amount: number) => {
    setCommitted((c) => Math.min(c + amount, 500000));
  }, []);

  const handleStepSubmit = useCallback(
    async (payload: Record<string, unknown>) => {
      const now = new Date().toISOString();
      const stepDataByPanel: Record<string, Record<string, unknown>> = {
        quiz: {
          quiz: {
            ...(application.quiz || {}),
            passed: Boolean(payload.passed),
            score: Number(payload.score || 0),
            answers: payload.answers,
            passedAt: now,
          },
        },
        cosigner: {
          cosigner: {
            ...(application.cosigner || {}),
            mode: payload.mode,
            invitedName: payload.invitedName,
            invitedEmail: payload.invitedEmail,
            invitedAt: now,
          },
        },
        financing: {
          financingMode: payload.mode,
          financingModeChosenAt: now,
        },
        commitment: {
          tier: payload.tier,
        },
        unit: {
          unit: {
            ...(application.unit || {}),
            ref: payload.ref,
            reservedAt: now,
          },
        },
        citizen: {
          citizenshipAttestation: {
            ...(application.citizenshipAttestation || {}),
            tokensSnapshot: payload.acquired,
            vouchesSnapshot: payload.vouches,
            isCitizen: Boolean(payload.complete),
            attestedAt: now,
          },
        },
        designlock: {
          designLock: {
            ...(application.designLock || {}),
            decision: payload.dropout ? 'dropout' : 'commit',
            decisionAt: now,
          },
        },
        stage: {
          stagePayments: {
            ...(application.stagePayments || {}),
            [`step_${step}`]: {
              ...(payload || {}),
              submittedAt: now,
            },
          },
        },
        keys: {
          keys: {
            ...(application.keys || {}),
            transferredAt: now,
          },
        },
      };
      const dataKey =
        step === 2
          ? 'quiz'
          : step === 3
            ? 'cosigner'
            : step === 4
              ? 'financing'
              : step === 5
                ? 'commitment'
                : step === 7
                  ? 'citizen'
                  : step === 8
                    ? 'unit'
                    : step === 9
                      ? 'designlock'
                      : step >= 10 && step <= 12
                        ? 'stage'
                        : step === 14
                          ? 'keys'
                          : '';
      await handlePersist({
        ...(stepDataByPanel[dataKey] || {}),
        stepHistory: [
          ...(application.stepHistory || []),
          {
            step,
            event: 'participant_submitted',
            at: now,
            by: 'participant',
            payload,
          },
        ],
      });
    },
    [
      application.citizenshipAttestation,
      application.cosigner,
      application.designLock,
      application.keys,
      application.quiz,
      application.stagePayments,
      application.stepHistory,
      application.unit,
      handlePersist,
      step,
    ],
  );

  if (!started) {
    return (
      <>
        <CohousingLandingHero
          committed={committed}
          onStart={() => setStarted(true)}
          onReadAgreement={() => setAgreementOpen(true)}
        />
        <CohousingAgreementModal
          open={agreementOpen}
          onClose={() => setAgreementOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 py-3.5 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="max-w-[860px] mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 items-center">
            <Button
              isFullWidth={false}
              size="small"
              variant="secondary"
              onClick={() => setStarted(false)}
            >
              {t('cohousing_flow_back_overview')}
            </Button>
            <Button
              isFullWidth={false}
              size="small"
              variant="secondary"
              onClick={() => setAgreementOpen(true)}
            >
              {t('cohousing_flow_agreement_short')}
            </Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {mode && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900">
                {t('cohousing_flow_mode_badge', { mode })}
              </span>
            )}
            <div className="text-xs text-gray-500">
              <span className="font-sans text-lg font-black text-accent">
                {Math.min(step, 14)}
              </span>
              <span className="ml-1">/ 14</span>
            </div>
            <div className="w-32 hidden sm:block">
              <FlowProgressBar value={Math.min(step, 14)} max={14} />
            </div>
          </div>
        </div>
      </div>

      <CohousingVerticalTimeline
        currentStep={step}
        mode={mode}
        onMode={handleMode}
        onAdvance={handleAdvance}
        onPoolAdd={handlePoolAdd}
        onStepSubmit={handleStepSubmit}
        currentStepSubmitted={currentStepSubmitted}
        quizDraftStorageKey={quizDraftStorageKey}
        quizInitialAnswers={quizInitialAnswers}
      />

      <CohousingAgreementModal
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
      />
    </>
  );
};
