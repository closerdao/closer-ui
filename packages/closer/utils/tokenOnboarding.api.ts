import { OnboardingQuest } from '../constants/tokenOnboardingQuests';
import api from './api';
import { buildOnboardingAwardPayload } from './tokenOnboarding.helpers';

export type OnboardingAwardResult =
  | { status: 'awarded' }
  /** The server already credited this quest — claiming twice is a no-op. */
  | { status: 'already-awarded' }
  /** Endpoint missing or refused. Progress still advances; carrots do not. */
  | { status: 'unavailable' };

/**
 * Credits the carrots for one quest.
 *
 * `POST /carrots/award/onboarding` is expected to be idempotent per
 * (user, questId) and to enforce the per-quest amount server side — the amount
 * sent here is a claim, not an instruction. The endpoint does not exist yet, so
 * a 404/403 resolves to `unavailable`: the member keeps their progress and the
 * page says the carrots are still pending rather than blocking the flow.
 */
export const awardOnboardingCarrots = async (
  quest: OnboardingQuest,
): Promise<OnboardingAwardResult> => {
  try {
    const { data } = await api.post(
      '/carrots/award/onboarding',
      buildOnboardingAwardPayload(quest),
    );
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
