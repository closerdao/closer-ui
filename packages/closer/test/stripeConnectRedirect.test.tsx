import { screen, waitFor } from '@testing-library/react';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextPageContext } from 'next';

import TdfOAuthStateHandler from '../../../apps/tdf/pages/api/stripe-connect/oauth-state';
import TdfCallbackPage from '../../../apps/tdf/pages/stripe-connect/callback';
import TdfStripeConnectPage from '../../../apps/tdf/pages/stripe-connect/index';
import VillageOAuthStateHandler from '../../../apps/village-app/pages/api/stripe-connect/oauth-state';
import VillageCallbackPage from '../../../apps/village-app/pages/stripe-connect/callback';
import VillageStripeConnectPage from '../../../apps/village-app/pages/stripe-connect/index';
import { renderWithNextIntl } from './utils';

const FIXED_URI = 'https://procurement.closer.earth/stripe-connect/callback';

// The app wrappers import `closer`, which resolves to this package's index; serve just the pages.
jest.mock('../index', () => ({
  StripeConnectPage: jest.requireActual('../pages/stripe-connect').default,
  StripeConnectCallbackPage: jest.requireActual(
    '../pages/stripe-connect/callback',
  ).default,
}));
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { post: jest.fn(() => new Promise(() => undefined)) },
}));
jest.mock('../contexts/auth', () => ({
  useAuth: () => ({ user: { roles: ['admin'] }, isLoading: false }),
}));
jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, replace: jest.fn() }),
}));
jest.mock('../components/StripeConnectPrompt', () => ({
  __esModule: true,
  default: ({ authorizeHref }: { authorizeHref: string }) => (
    <a data-testid="authorize" href={authorizeHref} />
  ),
}));

const api = jest.requireMock('../utils/api.js').default as { post: jest.Mock };

const callOAuthState = (
  handler: (req: NextApiRequest, res: NextApiResponse) => unknown,
  body: Record<string, unknown> = {},
) => {
  const res = {
    statusCode: 0,
    json: jest.fn(),
    setHeader: jest.fn(),
    status(code: number) {
      this.statusCode = code;
      return this;
    },
  };
  handler(
    {
      method: 'POST',
      headers: { host: 'my.village.org', 'x-forwarded-proto': 'https' },
      body,
    } as unknown as NextApiRequest,
    res as unknown as NextApiResponse,
  );
  const { state } = res.json.mock.calls[0][0] as { state: string };
  const cookies = res.setHeader.mock.calls[0][1] as string[];
  return { state, cookies, statusCode: res.statusCode };
};

const authorizeRedirectUri = async () => {
  await waitFor(() =>
    expect(screen.getByTestId('authorize').getAttribute('href')).toBeTruthy(),
  );
  const href = screen.getByTestId('authorize').getAttribute('href') as string;
  return new URL(href).searchParams.get('redirect_uri');
};

const callbackProps = {
  code: 'ac_123',
  errorMessage: null,
  denied: false,
  invalidState: false,
  redirectUri: 'https://my.village.org/stripe-connect/callback',
  returnTo: '/admin/config',
};

beforeEach(() => {
  api.post.mockClear();
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ state: 's' }) }),
  ) as unknown as typeof fetch;
});

describe('village-app Stripe Connect', () => {
  it('state is <nonce>.<origin> from the Host header, not the body', () => {
    const { state, cookies, statusCode } = callOAuthState(
      VillageOAuthStateHandler,
      { origin: 'https://evil.example' },
    );
    expect(statusCode).toBe(200);
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}\.https:\/\/my\.village\.org$/);
    expect(cookies[0]).toContain(`=${encodeURIComponent(state)};`);
  });

  it('authorizes with the fixed procurement redirect_uri', async () => {
    renderWithNextIntl(<VillageStripeConnectPage />);
    expect(await authorizeRedirectUri()).toBe(FIXED_URI);
  });

  it('completes with the fixed redirectUri, not the Host-derived one', async () => {
    renderWithNextIntl(<VillageCallbackPage {...callbackProps} />);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/stripe/connect/complete', {
        code: 'ac_123',
        redirectUri: FIXED_URI,
      }),
    );
  });
});

describe('other apps (tdf) keep per-origin Stripe Connect', () => {
  it('state is a bare nonce', () => {
    const { state } = callOAuthState(TdfOAuthStateHandler);
    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('authorizes with the page origin redirect_uri', async () => {
    renderWithNextIntl(<TdfStripeConnectPage />);
    expect(await authorizeRedirectUri()).toBe(
      `${window.location.origin}/stripe-connect/callback`,
    );
  });

  it('derives redirectUri from the Host header and completes with it', async () => {
    const props = await TdfCallbackPage.getInitialProps!({
      query: { code: 'ac_123', state: 'abc' },
      req: {
        headers: {
          host: 'tdf.example',
          cookie: 'stripe_connect_oauth_state=abc',
        },
      },
    } as unknown as NextPageContext);
    expect(props.redirectUri).toBe(
      'https://tdf.example/stripe-connect/callback',
    );

    renderWithNextIntl(<TdfCallbackPage {...callbackProps} code="ac_456" />);
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/stripe/connect/complete', {
        code: 'ac_456',
        redirectUri: callbackProps.redirectUri,
      }),
    );
  });
});

describe('village-app callback checks state against the nonce cookie', () => {
  const ORIGIN = 'https://my.village.org';

  const mintState = () => {
    const { state, cookies } = callOAuthState(VillageOAuthStateHandler);
    return { state, cookie: cookies[0].split(';')[0] };
  };

  const renderCallback = async (
    query: Record<string, string>,
    cookie?: string,
  ) => {
    const { messages: _messages, ...props } =
      await VillageCallbackPage.getInitialProps!({
        query,
        req: {
          headers: {
            host: 'my.village.org',
            'x-forwarded-proto': 'https',
            ...(cookie ? { cookie } : {}),
          },
        },
      } as unknown as NextPageContext);
    renderWithNextIntl(<VillageCallbackPage {...props} />);
    return props;
  };

  const expectRefused = async (props: { code: string | null }) => {
    expect(props).toMatchObject({ code: null, invalidState: true });
    expect(
      await screen.findByText('Session verification failed'),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  };

  it('refuses when state is missing', async () => {
    const { cookie } = mintState();
    await expectRefused(await renderCallback({ code: 'ac_no_state' }, cookie));
  });

  it('refuses when the nonce does not match the cookie', async () => {
    const { cookie } = mintState();
    const { state: other } = mintState();
    await expectRefused(
      await renderCallback({ code: 'ac_bad_nonce', state: other }, cookie),
    );
  });

  it('refuses when the nonce cookie is missing', async () => {
    const { state } = mintState();
    await expectRefused(await renderCallback({ code: 'ac_no_cookie', state }));
  });

  it('refuses state whose origin was changed after minting', async () => {
    const { state, cookie } = mintState();
    const nonce = state.slice(0, -`.${ORIGIN}`.length);
    await expectRefused(
      await renderCallback(
        { code: 'ac_bad_origin', state: `${nonce}.https://other.village.org` },
        cookie,
      ),
    );
  });

  it('completes with the code when state matches the cookie', async () => {
    const { state, cookie } = mintState();
    const props = await renderCallback({ code: 'ac_789', state }, cookie);
    expect(props).toMatchObject({ code: 'ac_789', invalidState: false });
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/stripe/connect/complete', {
        code: 'ac_789',
        redirectUri: FIXED_URI,
      }),
    );
  });

  it('shows a denial without sending a code', async () => {
    const { state, cookie } = mintState();
    const props = await renderCallback(
      { code: 'ac_denied', state, error: 'access_denied' },
      cookie,
    );
    expect(props).toMatchObject({ code: null, denied: true });
    expect(
      await screen.findByText('Stripe authorization was denied'),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('shows a Stripe error without sending a code', async () => {
    const { state, cookie } = mintState();
    const props = await renderCallback(
      {
        code: 'ac_stripe_error',
        state,
        error: 'invalid_scope',
        error_description: 'Bad scope',
      },
      cookie,
    );
    expect(props).toMatchObject({ code: null, errorMessage: 'Bad scope' });
    expect(await screen.findByText('Bad scope')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
