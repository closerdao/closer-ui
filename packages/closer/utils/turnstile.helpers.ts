import { TURNSTILE_SITE_KEY } from '../components/TurnstileWidget';

export function isTurnstileSubmitEnabled(
  isHuman: boolean,
  turnstileToken: string | null,
): boolean {
  if (!TURNSTILE_SITE_KEY) return true;
  return isHuman || !!turnstileToken;
}

export function turnstileTokenForRequest(
  isHuman: boolean,
  turnstileToken: string | null | undefined,
): string | null | undefined {
  if (isHuman) return undefined;
  return turnstileToken ?? undefined;
}
