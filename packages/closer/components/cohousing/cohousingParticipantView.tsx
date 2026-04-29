import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { COHOUSING_STEP_BY_N } from '../../constants/cohousingFlow';
import type { CohousingApplication } from '../../types/cohousingApplication';
import { buildClearParticipantStepPatch } from '../../utils/cohousingResetStep';
import Button from '../ui/Button';
import Card from '../ui/Card';
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

const getQuizAnswersFromApplication = (
  application: CohousingApplication,
): Record<string, string> | undefined => {
  const q = application.quiz as Record<string, unknown> | undefined;
  if (!q) {
    return undefined;
  }
  const direct = q.answers;
  if (
    direct &&
    typeof direct === 'object' &&
    !Array.isArray(direct)
  ) {
    return direct as Record<string, string>;
  }
  const nested = q.quiz as Record<string, unknown> | undefined;
  const nestedAnswers = nested?.answers;
  if (
    nestedAnswers &&
    typeof nestedAnswers === 'object' &&
    !Array.isArray(nestedAnswers)
  ) {
    return nestedAnswers as Record<string, string>;
  }
  return undefined;
};

const SHARED_FLOW_STEP_CAP = 3;

export const CohousingParticipantView = ({
  application,
  onPersist,
  sharedLeadApplication,
  readOnly = false,
}: {
  application: CohousingApplication;
  onPersist: (data: Record<string, unknown>) => Promise<void>;
  sharedLeadApplication?: {
    applicationId: string;
    partnerName: string;
  } | null;
  readOnly?: boolean;
}) => {
  const t = useTranslations();
  const step = getEffectiveStep(application);
  const [started, setStarted] = useState(() => readOnly || step > 1);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [committed, setCommitted] = useState(COHOUSING_DEFAULT_COMMITTED);
  const [adminClearing, setAdminClearing] = useState(false);
  const [mode, setMode] = useState<string | null>(
    application.financingMode ?? null,
  );
  const stepDef = COHOUSING_STEP_BY_N[step];
  const hasParticipantPanel = Boolean(stepDef?.panel);

  useEffect(() => {
    setMode(application.financingMode ?? null);
  }, [application.financingMode]);
  const submittedSteps = new Set(
    (application.stepHistory || [])
      .filter((entry) => entry?.event === 'participant_submitted')
      .map((entry) => Number(entry?.step))
      .filter((entry) => Number.isFinite(entry)),
  );
  const currentStepSubmitted = submittedSteps.has(step);
  const quizDraftStorageKey = `cohousing:tdf-quiz:${application._id}`;
  const applicantUserId =
    typeof application.createdBy === 'string'
      ? application.createdBy
      : application.createdBy &&
          typeof application.createdBy === 'object' &&
          application.createdBy !== null &&
          '_id' in application.createdBy
        ? String((application.createdBy as { _id: string })._id)
        : undefined;
  const quizInitialAnswers = getQuizAnswersFromApplication(application);

  const stepCap = sharedLeadApplication ? SHARED_FLOW_STEP_CAP : 14;
  const headerStepDisplay = Math.min(step, stepCap);

  const handlePersist = useCallback(
    async (data: Record<string, unknown>) => {
      await onPersist(data);
    },
    [onPersist],
  );

  const handleAdvance = useCallback(async () => {
    if (readOnly) {
      return;
    }
    const next = Math.min(step + 1, 14);
    await handlePersist({ currentStep: next });
  }, [handlePersist, readOnly, step]);

  const handleMode = useCallback(
    async (m: string) => {
      if (readOnly) {
        return;
      }
      setMode(m);
      await handlePersist({ financingMode: m });
    },
    [handlePersist, readOnly],
  );

  const handlePoolAdd = useCallback(
    (amount: number) => {
      if (readOnly) {
        return;
      }
      setCommitted((c) => Math.min(c + amount, 500000));
    },
    [readOnly],
  );

  const handleResetStepSubmission = useCallback(async () => {
    if (readOnly) {
      return;
    }
    if (
      typeof window !== 'undefined' &&
      !window.confirm(t('cohousing_reset_step_confirm'))
    ) {
      return;
    }
    setAdminClearing(true);
    try {
      await handlePersist(
        buildClearParticipantStepPatch(application, step),
      );
      if (
        step === 2 &&
        typeof window !== 'undefined' &&
        typeof quizDraftStorageKey === 'string'
      ) {
        window.localStorage.removeItem(quizDraftStorageKey);
      }
    } finally {
      setAdminClearing(false);
    }
  }, [
    application,
    handlePersist,
    quizDraftStorageKey,
    readOnly,
    step,
    t,
  ]);

  const handleStepSubmit = useCallback(
    async (payload: Record<string, unknown>) => {
      if (readOnly) {
        return;
      }
      const now = new Date().toISOString();
      const stepDataByPanel: Record<string, Record<string, unknown>> = {
        quiz: (() => {
          const prev = application.quiz as Record<string, unknown> | undefined;
          const base =
            prev && typeof prev === 'object' ? { ...prev } : {};
          if ('quiz' in base) {
            delete base.quiz;
          }
          return {
            ...base,
            passed: Boolean(payload.passed),
            score: Number(payload.score || 0),
            answers: payload.answers,
            passedAt: now,
          };
        })(),
        cosigner: {
          ...(application.cosigner || {}),
          mode: payload.mode,
          invitedName: payload.invitedName,
          invitedEmail: payload.invitedEmail,
          userId:
            typeof payload.invitedUserId === 'string'
              ? payload.invitedUserId
              : undefined,
          invitedAt: now,
        },
        financing: {
          financingMode: payload.mode,
          financingModeChosenAt: now,
        },
        commitment: {
          tier: payload.tier,
        },
        unit: {
          ...(application.unit || {}),
          ref: payload.ref,
          reservedAt: now,
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
          ...(application.keys || {}),
          transferredAt: now,
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
      const panelData = stepDataByPanel[dataKey];
      const stepHistoryPayload = [
        ...(application.stepHistory || []),
        {
          step,
          event: 'participant_submitted',
          at: now,
          by: 'participant',
          payload,
        },
      ];

      if (!panelData && dataKey) {
        return;
      }

      if (dataKey === 'quiz') {
        await handlePersist({
          quiz: panelData,
          stepHistory: stepHistoryPayload,
        });
        return;
      }
      if (dataKey === 'cosigner') {
        await handlePersist({
          cosigner: panelData,
          stepHistory: stepHistoryPayload,
        });
        return;
      }
      if (dataKey === 'unit') {
        await handlePersist({
          unit: panelData,
          stepHistory: stepHistoryPayload,
        });
        return;
      }
      if (dataKey === 'keys') {
        await handlePersist({
          keys: panelData,
          stepHistory: stepHistoryPayload,
        });
        return;
      }

      await handlePersist({
        ...(panelData || {}),
        stepHistory: stepHistoryPayload,
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
      readOnly,
      step,
    ],
  );

  useEffect(() => {
    if (readOnly) {
      setStarted(true);
    }
  }, [readOnly]);

  if (!started) {
    return (
      <>
        <CohousingLandingHero
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
      {readOnly && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          {t('cohousing_view_only_banner')}
        </div>
      )}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-3.5 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="max-w-[860px] mx-auto flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 items-center">
            {!readOnly && (
              <Button
                isFullWidth={false}
                size="small"
                variant="secondary"
                onClick={() => setStarted(false)}
              >
                {t('cohousing_flow_back_overview')}
              </Button>
            )}
            <Button
              isFullWidth={false}
              size="small"
              variant="secondary"
              onClick={() => setAgreementOpen(true)}
            >
              {t('cohousing_flow_agreement_short')}
            </Button>
            {!readOnly &&
              currentStepSubmitted &&
              hasParticipantPanel && (
              <Button
                isFullWidth={false}
                size="small"
                variant="secondary"
                isLoading={adminClearing}
                onClick={() => void handleResetStepSubmission()}
                className="border-red-300 text-red-800 hover:bg-red-50"
              >
                {t('cohousing_reset_step')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {mode && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-900">
                {t('cohousing_flow_mode_badge', { mode })}
              </span>
            )}
            <div className="text-xs text-gray-500">
              <span className="font-sans text-lg font-black text-accent">
                {headerStepDisplay}
              </span>
              <span className="ml-1">/ {stepCap}</span>
            </div>
            <div className="w-32 hidden sm:block">
              <FlowProgressBar value={headerStepDisplay} max={stepCap} />
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
        applicantUserId={applicantUserId}
        readOnly={readOnly}
        maxStepInclusive={
          sharedLeadApplication ? SHARED_FLOW_STEP_CAP : undefined
        }
        footerBelowSteps={
          sharedLeadApplication ? (
            <Card className="p-5 mt-2 border border-accent/30 bg-accent/5">
              <p className="text-sm text-gray-700 mb-4">
                {t('cohousing_cosigner_shared_application_body')}
              </p>
              <Link
                href={`/cohousing/application/${encodeURIComponent(
                  sharedLeadApplication.applicationId,
                )}`}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
              >
                {t('cohousing_cosigner_shared_application_cta', {
                  name: sharedLeadApplication.partnerName,
                })}
              </Link>
            </Card>
          ) : undefined
        }
      />

      <CohousingAgreementModal
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
      />
    </>
  );
};
