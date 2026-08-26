import { OnboardingQuest } from '../constants/tokenOnboardingQuests';
import api from './api';

export type OnboardingAwardResult =
  | { status: 'awarded' }
  /** The server already credited this step — claiming twice is a no-op. */
  | { status: 'already-awarded' }
  /** Endpoint missing or refused. Progress still advances; carrots do not. */
  | { status: 'unavailable' };

/**
 * What the member actually did to pass the gate — quiz picks and scores,
 * ticked boxes, or the wallet state the page observed. Stored server side
 * with the claim.
 */
export type OnboardingStepResponse = Record<string, unknown>;

/**
 * Submits one completed step to `POST /credits/claim/onboarding`.
 *
 * The endpoint holds the step table (ids and carrot amounts) and is
 * idempotent per (user, step) — the client only reports which step was
 * passed and how. A 404/403 resolves to `unavailable`: the member keeps
 * their progress and the page says the carrots are still pending rather
 * than blocking the flow.
 */
export const submitOnboardingStep = async (
  quest: OnboardingQuest,
  response: OnboardingStepResponse,
): Promise<OnboardingAwardResult> => {
  try {
    const { data } = await api.post('/credits/claim/onboarding', {
      step: quest.id,
      response,
    });
    const alreadyAwarded = Boolean(
      (data?.results as { alreadyAwarded?: boolean } | undefined)
        ?.alreadyAwarded,
    );
    return { status: alreadyAwarded ? 'already-awarded' : 'awarded' };
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 409) return { status: 'already-awarded' };
    return { status: 'unavailable' };
  }
};
