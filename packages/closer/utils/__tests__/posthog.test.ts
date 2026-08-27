/* eslint-disable @typescript-eslint/no-require-imports */
type MockedPostHogInstance = {
  init: jest.Mock;
  capture: jest.Mock;
  identify: jest.Mock;
  reset: jest.Mock;
  register: jest.Mock;
  set_config: jest.Mock;
  debug: jest.Mock;
  __loaded?: boolean;
};

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    capture: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    register: jest.fn(),
    set_config: jest.fn(),
    debug: jest.fn(),
  },
}));

// `load()` resets the registry, so the posthog-js mock instance the module
// under test sees is only reachable by re-requiring it after the reset.
let posthog: MockedPostHogInstance;
let mocked: MockedPostHogInstance;

const ENV_KEYS = [
  'NEXT_PUBLIC_POSTHOG_ENABLED',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'NEXT_PUBLIC_APP_NAME',
] as const;
const saved: Record<string, string | undefined> = {};

const load = (): typeof import('../posthog') => {
  jest.resetModules();
  posthog = require('posthog-js').default as MockedPostHogInstance;
  mocked = posthog;
  return require('../posthog') as typeof import('../posthog');
};

beforeEach(() => {
  ENV_KEYS.forEach((k) => {
    saved[k] = process.env[k];
    delete process.env[k];
  });
  document.cookie = 'CookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  localStorage.clear();
});

afterEach(() => {
  ENV_KEYS.forEach((k) => {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  });
});

describe('isPostHogEnabled / initPostHog', () => {
  it('is off by default even with a key', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    const ph = load();
    expect(ph.isPostHogEnabled()).toBe(false);
    expect(ph.initPostHog()).toBe(false);
    expect(mocked.init).not.toHaveBeenCalled();
  });

  it('is off when ENABLED=false', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'false';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    expect(load().isPostHogEnabled()).toBe(false);
  });

  it('falls back to the baked-in project key when no env override is set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    const ph = load();
    expect(ph.getPostHogKey()).toBe(ph.DEFAULT_POSTHOG_KEY);
    expect(ph.DEFAULT_POSTHOG_KEY).toMatch(/^phc_/);
    expect(ph.initPostHog()).toBe(true);
    expect(mocked.init).toHaveBeenCalledWith(
      ph.DEFAULT_POSTHOG_KEY,
      expect.any(Object),
    );
  });

  it('inits once with ENABLED=true and a key, via the /ingest proxy', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    const ph = load();
    expect(ph.initPostHog()).toBe(true);
    expect(ph.initPostHog()).toBe(true);
    expect(mocked.init).toHaveBeenCalledTimes(1);
    const [key, config] = mocked.init.mock.calls[0];
    expect(key).toBe('phc_test');
    expect(config.api_host).toBe('/ingest');
    expect(config.ui_host).toBe('https://eu.posthog.com');
    expect(config.person_profiles).toBe('identified_only');
    expect(config.capture_exceptions).toBe(true);
    expect(config.enable_recording_console_log).toBe(false);
    expect(config.session_recording.maskAllInputs).toBe(true);
    expect(config.session_recording.maskTextSelector).toBe('[data-ph-mask]');
    expect(config.session_recording.blockSelector).toBe('[data-ph-mask]');
  });

  it('registers the app super-property on load', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.NEXT_PUBLIC_APP_NAME = 'moos';
    load().initPostHog();
    const { loaded } = mocked.init.mock.calls[0][1];
    loaded(posthog);
    expect(mocked.register).toHaveBeenCalledWith({ app: 'moos' });
  });
});

describe('consent-aware persistence', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
  });

  it('initialises and captures pre-consent, with memory-only persistence', () => {
    const ph = load();
    expect(ph.initPostHog()).toBe(true);
    expect(mocked.init.mock.calls[0][1].persistence).toBe('memory');
    ph.trackEvent('booking_created');
    expect(mocked.capture).toHaveBeenCalledWith('booking_created', undefined);
  });

  it('never writes cookies or localStorage before consent is granted', () => {
    const ph = load();
    ph.initPostHog();
    ph.identifyUser('u1', { roles: ['member'] });
    ph.trackEvent('booking_created');
    expect(document.cookie).not.toContain('CookieConsent=true');
    expect(localStorage.length).toBe(0);
  });

  it('trusts an already-loaded SDK regardless of consent', () => {
    const ph = load();
    posthog.__loaded = true;
    expect(ph.initPostHog()).toBe(true);
    expect(mocked.init).not.toHaveBeenCalled();
    delete posthog.__loaded;
  });

  it('starts persisted when consent cookie already exists', () => {
    document.cookie = 'CookieConsent=true';
    load().initPostHog();
    expect(mocked.init.mock.calls[0][1].persistence).toBe(
      'localStorage+cookie',
    );
  });

  it('upgrades persistence in place when consent is granted after init', () => {
    const ph = load();
    ph.initPostHog();
    ph.identifyUser('u1', { roles: ['member'] });
    expect(mocked.identify).toHaveBeenCalledWith('u1', {
      roles: ['member'],
      app: undefined,
    });
    document.cookie = 'CookieConsent=true';
    ph.applyConsentPersistence();
    expect(mocked.init).toHaveBeenCalledTimes(1);
    expect(mocked.set_config).toHaveBeenCalledWith({
      persistence: 'localStorage+cookie',
    });
  });

  it('does not touch posthog when consent is granted but disabled', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'false';
    load().applyConsentPersistence();
    expect(mocked.set_config).not.toHaveBeenCalled();
  });
});

describe('identify / reset / track', () => {
  it('no-op when disabled', () => {
    const ph = load();
    ph.identifyUser('u1', { roles: ['member'] });
    ph.resetUser();
    ph.trackEvent('x');
    expect(mocked.identify).not.toHaveBeenCalled();
    expect(mocked.reset).not.toHaveBeenCalled();
    expect(mocked.capture).not.toHaveBeenCalled();
  });

  it('forwards when enabled, attaching app to identify', () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.NEXT_PUBLIC_APP_NAME = 'lios';
    const ph = load();
    ph.initPostHog();
    ph.identifyUser('u1', { roles: ['member'] });
    expect(mocked.identify).toHaveBeenCalledWith('u1', {
      roles: ['member'],
      app: 'lios',
    });
    ph.trackEvent('booking_created', { status: 'confirmed' });
    expect(mocked.capture).toHaveBeenCalledWith('booking_created', {
      status: 'confirmed',
    });
    ph.resetUser();
    expect(mocked.reset).toHaveBeenCalled();
    expect(mocked.register).toHaveBeenLastCalledWith({ app: 'lios' });
  });
});
