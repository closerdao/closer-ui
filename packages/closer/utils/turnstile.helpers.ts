import { TURNSTILE_SITE_KEY } from '../components/TurnstileWidget';

export function isTurnstileSubmitEnabled(
  turnstileToken: string | null,
): boolean {
  if (!TURNSTILE_SITE_KEY) return true;
  return !!turnstileToken;
}

export function createTurnstileHandlers(
  setTurnstileToken: (token: string | null) => void,
) {
  return {
    onVerify: setTurnstileToken,
    onExpire: () => setTurnstileToken(null),
    onError: () => setTurnstileToken(null),
  };
}
