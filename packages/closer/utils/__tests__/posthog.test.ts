/* eslint-disable @typescript-eslint/no-require-imports */
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
let posthog: any;
let mocked: Record<string, jest.Mock>;

const ENV_KEYS = [
  'NEXT_PUBLIC_POSTHOG_ENABLED',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'NEXT_PUBLIC_APP_NAME',
] as const;
const saved: Record<string, string | undefined> = {};

const load = () => {
  jest.resetModules();
  posthog = require('posthog-js').default;
  mocked = posthog;
  return require('../posthog') as typeof import('../posthog');
};

beforeEach(() => {
  ENV_KEYS.forEach((k) => {
    saved[k] = process.env[k];
    delete process.env[k];
  });
  document.cookie = 'CookieConsent=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
    expect(config.session_recording.maskAllInputs).toBe(true);
    expect(config.session_recording.maskTextSelector).toBe('[data-ph-mask]');
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

describe('cookie consent → persistence', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
  });

  it('starts in memory persistence without consent', () => {
    load().initPostHog();
    expect(mocked.init.mock.calls[0][1].persistence).toBe('memory');
  });

  it('starts persisted when consent cookie already exists', () => {
    document.cookie = 'CookieConsent=true';
    load().initPostHog();
    expect(mocked.init.mock.calls[0][1].persistence).toBe(
      'localStorage+cookie',
    );
  });

  it('upgrades persistence when consent is granted after init', () => {
    const ph = load();
    ph.initPostHog();
    ph.applyConsentPersistence();
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
  });
});

describe('logMetric mirror', () => {
  it('captures every platform metric in PostHog', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_ENABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    jest.doMock('../api', () => ({
      __esModule: true,
      default: { post: jest.fn().mockResolvedValue({}) },
    }));
    const ph = load();
      const { logMetric } = require('../metrics') as typeof import('../metrics');
    ph.initPostHog();
    await logMetric({
      event: 'signup-completed',
      category: 'signup',
      value: 'completed',
    });
    expect(mocked.capture).toHaveBeenCalledWith('signup-completed', {
      category: 'signup',
      value: 'completed',
      point: 1,
      linkedObjectType: undefined,
      linkedObjectId: undefined,
    });
  });
});
