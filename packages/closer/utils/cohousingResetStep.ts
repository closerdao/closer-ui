import type { CohousingApplication } from '../types/cohousingApplication';

export function buildClearParticipantStepPatch(
  application: CohousingApplication,
  stepNumber: number,
): Record<string, unknown> {
  const filteredHistory = (application.stepHistory || []).filter(
    (entry) => {
      if (Number(entry?.step) !== stepNumber) {
        return true;
      }
      if (entry?.event === 'participant_submitted') {
        return false;
      }
      if (stepNumber === 4 && entry?.event === 'team_approved_step') {
        return false;
      }
      return true;
    },
  );

  const patch: Record<string, unknown> = {
    stepHistory: filteredHistory,
    currentStep: stepNumber,
  };

  switch (stepNumber) {
    case 2:
      patch.quiz = {};
      break;
    case 3:
      patch.cosigner = {};
      break;
    case 4:
      patch.financingMode = null;
      patch.financingModeChosenAt = null;
      break;
    case 5:
      patch.tier = null;
      patch.financingDocumentsAcknowledged = null;
      patch.financingDocumentsAcknowledgedAt = null;
      break;
    case 7:
      patch.citizenshipAttestation = {};
      break;
    case 8:
      patch.unit = {};
      break;
    case 9:
      patch.designLock = {};
      break;
    case 10:
    case 11:
    case 12: {
      const prev = application.stagePayments || {};
      const next = { ...prev } as Record<string, unknown>;
      delete next[`step_${stepNumber}`];
      patch.stagePayments = next;
      break;
    }
    case 14:
      patch.keys = {};
      break;
    default:
      break;
  }

  return patch;
}
