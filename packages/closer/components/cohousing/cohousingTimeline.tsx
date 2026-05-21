import { useEffect, useRef } from 'react';

import { useTranslations } from 'next-intl';

import {
  COHOUSING_PHASES,
  COHOUSING_STEP_BY_N,
  type CohousingPhaseDef,
  type CohousingStepDef,
} from '../../constants/cohousingFlow';
import { FlowBadge } from './cohousingFlowUi';
import {
  CitizenPanel,
  CommitmentPanel,
  CosignerPanel,
  DesignLockPanel,
  FinancingPanel,
  KeysPanel,
  QuizPanel,
  StagePanel,
  TeamWaitingInline,
  UnitPanel,
} from './cohousingStepPanels';

const TimelineStepBlock = ({
  step,
  state,
  mode,
  onMode,
  onAdvance,
  onPoolAdd,
  onStepSubmit,
  currentStepSubmitted,
  quizDraftStorageKey,
  quizInitialAnswers,
  applicantUserId,
  readOnly,
}: {
  step: CohousingStepDef;
  state: 'done' | 'active' | 'locked';
  mode: string | null;
  onMode: (m: string) => void;
  onAdvance: () => void;
  onPoolAdd: (n: number) => void;
  onStepSubmit: (payload: Record<string, unknown>) => Promise<void>;
  currentStepSubmitted: boolean;
  quizDraftStorageKey: string;
  quizInitialAnswers?: Record<string, string>;
  applicantUserId?: string;
  readOnly: boolean;
}) => {
  const t = useTranslations();
  const isDone = state === 'done';
  const isActive = state === 'active';
  const isLocked = state === 'locked';

  const dot =
    isDone || isActive
      ? 'border-accent bg-white ring-2 ring-accent'
      : 'border-gray-300 bg-white ring-2 ring-gray-300';

  return (
    <div className="flex gap-5 items-start py-2.5 relative">
      <div
        className={`w-5 h-5 ml-[22px] mt-[18px] shrink-0 rounded-full border-[3px] z-[2] flex items-center justify-center transition-all ${dot} ${isActive ? 'shadow-[0_0_0_6px_rgba(236,72,153,0.15)]' : ''}`}
      >
        {isDone && (
          <span className="text-accent text-[10px] font-black leading-none">✓</span>
        )}
      </div>

      <div
        className={`flex-1 px-5 py-4 rounded-2xl border transition-all ${
          isActive
            ? 'border-2 border-accent bg-white shadow-lg shadow-accent/10'
            : isDone
              ? 'border border-gray-200 bg-white'
              : 'border border-gray-200 bg-gray-50 opacity-[0.55]'
        }`}
      >
        <div className="flex flex-wrap justify-between gap-3 items-start">
          <div className="flex-1 min-w-[200px]">
            <div className="flex flex-wrap gap-2 items-center mb-1.5">
              <span className="font-sans tabular-nums text-[11px] font-bold text-gray-500">
                {t('cohousing_flow_step_label', { n: String(step.n).padStart(2, '0') })}
              </span>
              {isActive && (
                <FlowBadge className="border-accent text-accent bg-accent/10">
                  {t('cohousing_flow_you_are_here')}
                </FlowBadge>
              )}
              {isDone && (
                <FlowBadge className="border-green-300 text-green-800 bg-green-50">
                  {t('cohousing_flow_done')}
                </FlowBadge>
              )}
              {step.owner === 'team' && (
                <FlowBadge className="border-blue-300 text-blue-800 bg-blue-50">
                  {t('cohousing_flow_team_action_badge')}
                </FlowBadge>
              )}
              {isLocked && (
                <FlowBadge>{t('cohousing_flow_locked')}</FlowBadge>
              )}
            </div>
            <h3
              className={`font-sans text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight mb-1 ${
                isLocked ? 'text-gray-500' : 'text-gray-900'
              }`}
            >
              {t(step.titleKey)}
            </h3>
            <p
              className={`text-sm ${isLocked ? 'text-gray-500' : 'text-gray-600'} font-normal`}
            >
              {t(step.shortKey)}
            </p>
          </div>
          <div className="text-right min-w-[120px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">
              {t('cohousing_flow_expected')}
            </span>
            <div
              className={`font-sans text-[15px] font-bold ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {t(step.dateKey)}
            </div>
          </div>
        </div>

        <p
          className={`text-sm leading-relaxed mt-3 whitespace-pre-line ${
            isLocked ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          {t(step.descKey)}
        </p>

        {isActive && (
          <div className="mt-4 space-y-3">
            {step.owner === 'participant' && currentStepSubmitted && (
              <FlowBadge className="border-blue-300 text-blue-800 bg-blue-50">
                {t('cohousing_flow_submitted_waiting_team')}
              </FlowBadge>
            )}
            {readOnly ? (
              !(
                step.owner === 'participant' &&
                currentStepSubmitted
              ) && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {t('cohousing_view_only_step_hint')}
                </div>
              )
            ) : (
              <>
                {step.panel === 'quiz' && !currentStepSubmitted && (
                  <QuizPanel
                    draftStorageKey={quizDraftStorageKey}
                    initialAnswers={quizInitialAnswers}
                    onSubmit={onStepSubmit}
                  />
                )}
                {step.panel === 'cosigner' && !currentStepSubmitted && (
                  <CosignerPanel
                    excludeUserId={applicantUserId}
                    onSubmit={(p) => void onStepSubmit(p)}
                  />
                )}
                {step.panel === 'financing' && !currentStepSubmitted && (
                  <FinancingPanel
                    onSubmit={(p) => {
                      onMode(String(p.mode || ''));
                      void onStepSubmit(p);
                    }}
                  />
                )}
                {step.panel === 'commitment' && !currentStepSubmitted && (
                  <CommitmentPanel
                    onSubmit={(p) => void onStepSubmit(p)}
                    financingMode={mode}
                    onPoolAdd={onPoolAdd}
                  />
                )}
                {step.panel === 'unit' && !currentStepSubmitted && (
                  <UnitPanel onSubmit={(p) => void onStepSubmit(p)} />
                )}
                {step.panel === 'citizen' && !currentStepSubmitted && (
                  <CitizenPanel onSubmit={(p) => void onStepSubmit(p)} />
                )}
                {step.panel === 'designlock' && !currentStepSubmitted && (
                  <DesignLockPanel
                    onSubmit={(p) => void onStepSubmit(p)}
                    mode={mode}
                  />
                )}
                {step.panel === 'stage' && !currentStepSubmitted && (
                  <StagePanel
                    onSubmit={(p) => void onStepSubmit(p)}
                    step={step}
                    mode={mode}
                  />
                )}
                {step.panel === 'keys' && !currentStepSubmitted && (
                  <KeysPanel onSubmit={(p) => void onStepSubmit(p)} />
                )}
                {step.owner === 'team' && step.teamActionKey && (
                  <TeamWaitingInline step={step} onAdvance={onAdvance} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PhaseHeader = ({ phase }: { phase: CohousingPhaseDef }) => {
  const t = useTranslations();
  return (
    <div className="flex items-center gap-5 pt-8 pb-4 mb-1">
      <div
        className={`w-16 h-16 rounded-full bg-white border-2 shrink-0 flex items-center justify-center z-[2] ${phase.ringClass}`}
      >
        <span className={`font-sans text-2xl font-black ${phase.accentClass}`}>
          {phase.num}
        </span>
      </div>
      <div>
        <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${phase.accentClass}`}>
          {t('cohousing_flow_chapter', { num: phase.num })}
        </div>
        <h2 className="font-sans text-2xl sm:text-3xl font-black uppercase text-gray-900 tracking-tight leading-none">
          {t(phase.titleKey)}
        </h2>
        <p className="text-sm text-gray-500 mt-1.5">{t(phase.subKey)}</p>
      </div>
    </div>
  );
};

export const CohousingVerticalTimeline = ({
  currentStep,
  mode,
  onMode,
  onAdvance,
  onPoolAdd,
  onStepSubmit,
  currentStepSubmitted,
  quizDraftStorageKey,
  quizInitialAnswers,
  applicantUserId,
  maxStepInclusive,
  readOnly = false,
}: {
  currentStep: number;
  mode: string | null;
  onMode: (m: string) => void;
  onAdvance: () => void;
  onPoolAdd: (n: number) => void;
  onStepSubmit: (payload: Record<string, unknown>) => Promise<void>;
  currentStepSubmitted: boolean;
  quizDraftStorageKey: string;
  quizInitialAnswers?: Record<string, string>;
  applicantUserId?: string;
  maxStepInclusive?: number;
  readOnly?: boolean;
}) => {
  const t = useTranslations();
  const stepRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const cap = maxStepInclusive ?? 14;
  const progressDen =
    maxStepInclusive != null ? Math.max(maxStepInclusive - 1, 1) : 13;
  const cursor = Math.min(currentStep, cap);
  const pastCap =
    maxStepInclusive != null && currentStep > maxStepInclusive;

  const stepVisualState = (
    sn: number,
  ): 'done' | 'active' | 'locked' => {
    if (pastCap) {
      return 'done';
    }
    if (sn < cursor) {
      return 'done';
    }
    if (sn === cursor) {
      return 'active';
    }
    return 'locked';
  };

  useEffect(() => {
    const scrollTarget = pastCap ? maxStepInclusive ?? currentStep : cursor;
    const el = stepRefs.current[scrollTarget];
    if (el) {
      const tmr = setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
      return () => clearTimeout(tmr);
    }
  }, [cursor, currentStep, maxStepInclusive, pastCap]);


  return (
    <div className="relative max-w-[860px] mx-auto">
      <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-gray-200" />
      <div
        className="absolute left-[31px] top-10 w-0.5 bg-accent transition-[height] duration-1000 ease-out"
        style={{
          height: `${Math.max(0, ((Math.min(currentStep, cap) - 1) / progressDen) * 100)}%`,
        }}
      />

      {COHOUSING_PHASES.map((ph) => {
        const stepsForPhase = ph.steps.filter(
          (sn) => maxStepInclusive == null || sn <= maxStepInclusive,
        );
        if (stepsForPhase.length === 0) {
          return null;
        }
        return (
          <div key={ph.id} className="mb-4">
            <PhaseHeader phase={ph} />
            {stepsForPhase.map((sn) => {
              const s = COHOUSING_STEP_BY_N[sn];
              const state = stepVisualState(sn);
              return (
                <div
                  key={sn}
                  ref={(el) => {
                    stepRefs.current[sn] = el;
                  }}
                >
                  <TimelineStepBlock
                    step={s}
                    state={state}
                    mode={mode}
                    onMode={onMode}
                    onAdvance={onAdvance}
                    onPoolAdd={onPoolAdd}
                    onStepSubmit={onStepSubmit}
                    currentStepSubmitted={
                      currentStepSubmitted &&
                      sn === currentStep &&
                      !pastCap
                    }
                    quizDraftStorageKey={quizDraftStorageKey}
                    quizInitialAnswers={quizInitialAnswers}
                    applicantUserId={applicantUserId}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
          </div>
        );
      })}

      {maxStepInclusive == null && (
      <div className="flex gap-5 items-center pl-[22px] mt-6">
        <div
          className={`w-5 h-5 rounded-full border-[3px] border-white shrink-0 shadow-[0_0_0_2px] ${
            currentStep > 14 ? 'bg-accent shadow-accent' : 'bg-gray-200 shadow-gray-300'
          }`}
        />
        <div
          className={`font-sans text-lg sm:text-xl font-black uppercase tracking-wide ${
            currentStep > 14 ? 'text-accent' : 'text-gray-400'
          }`}
        >
          {t('cohousing_flow_end_marker')}
        </div>
      </div>
      )}
    </div>
  );
};

export { COHOUSING_STEP_BY_N };
