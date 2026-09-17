import api from '../api';

jest.mock('../posthog', () => ({
  posthog: {
    get_distinct_id: jest.fn(() => 'test-distinct-id'),
    get_session_id: jest.fn(() => 'test-session-id'),
  },
}));

describe('api PostHog correlation headers', () => {
  it('injects x-posthog-distinct-id and x-posthog-session-id into request headers', async () => {
    let capturedHeaders: any = null;
    (api.defaults as any).adapter = async (config: any) => {
      capturedHeaders = config.headers;
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await api.get('/test-posthog-headers');

    const distinctHeader =
      typeof capturedHeaders.get === 'function'
        ? capturedHeaders.get('x-posthog-distinct-id')
        : capturedHeaders['x-posthog-distinct-id'];
    const sessionHeader =
      typeof capturedHeaders.get === 'function'
        ? capturedHeaders.get('x-posthog-session-id')
        : capturedHeaders['x-posthog-session-id'];

    expect(distinctHeader).toBe('test-distinct-id');
    expect(sessionHeader).toBe('test-session-id');
  });
});
