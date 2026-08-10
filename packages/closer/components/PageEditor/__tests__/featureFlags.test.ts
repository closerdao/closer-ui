import { getPageEditorFeatureFlags } from '../featureFlags';

describe('getPageEditorFeatureFlags', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it('enables team, press, and dataroom by default', () => {
    const flags = getPageEditorFeatureFlags({});
    expect(flags.team).toBe(true);
    expect(flags.press).toBe(true);
    expect(flags.dataroom).toBe(true);
  });

  it('gates token on env flag', () => {
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'true';
    expect(getPageEditorFeatureFlags({}).token).toBe(true);
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'false';
    expect(getPageEditorFeatureFlags({}).token).toBe(false);
  });

  it('gates fundraiser on env and config', () => {
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US = 'true';
    expect(getPageEditorFeatureFlags({ fundraiser: { enabled: true } }).fundraiser).toBe(
      true,
    );
    expect(getPageEditorFeatureFlags({ fundraiser: { enabled: false } }).fundraiser).toBe(
      false,
    );
  });
});
