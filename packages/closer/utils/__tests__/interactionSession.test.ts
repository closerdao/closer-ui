import { INTERACTION_SESSION_LOCAL_STORAGE_KEY } from '../../constants';
import { getStoredInteractionSessionKey } from '../interactionSession';

/**
 * The API signs the session key as a JWT and rejects expired ones with a 401,
 * which is what breaks anonymous form submissions. Build tokens the same shape
 * so we can assert we never hand one back past its expiry.
 */
const makeToken = (expSecondsFromNow: number) => {
  const payload = {
    typ: 'interaction',
    sub: '65f0000000000000000000aa',
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  };
  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.sig`;
};

const store = (value: string) =>
  localStorage.setItem(INTERACTION_SESSION_LOCAL_STORAGE_KEY, value);

describe('getStoredInteractionSessionKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(getStoredInteractionSessionKey()).toBeNull();
  });

  it('returns a key that is still valid', () => {
    const token = makeToken(60 * 60);
    store(token);
    expect(getStoredInteractionSessionKey()).toBe(token);
  });

  it('treats an expired key as absent so a new session is fetched', () => {
    store(makeToken(-60));
    expect(getStoredInteractionSessionKey()).toBeNull();
  });

  it('treats a key expiring within the buffer as absent', () => {
    store(makeToken(30));
    expect(getStoredInteractionSessionKey()).toBeNull();
  });

  it('treats an unparseable key as absent', () => {
    store('not-a-jwt');
    expect(getStoredInteractionSessionKey()).toBeNull();
  });

  it('treats a key with no exp claim as absent', () => {
    const encode = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');
    store(`${encode({ alg: 'HS256' })}.${encode({ sub: 'abc' })}.sig`);
    expect(getStoredInteractionSessionKey()).toBeNull();
  });
});
