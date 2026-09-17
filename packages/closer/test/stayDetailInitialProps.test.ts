import type { NextPageContext } from 'next';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import api from '../utils/api.js';

// jest.config maps the bare "../utils/api" specifier to a shared mock; the page
// imports "../../../utils/api", so mock the real module path directly.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: null } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: () => '',
  cdn: '',
  invalidateGetCache: jest.fn(),
  refreshTokensProactively: jest.fn(() => Promise.resolve(null)),
  setOnSessionInvalid: jest.fn(),
}));

const getInitialProps = StayBookingSummaryPage.getInitialProps as (
  ctx: NextPageContext,
) => Promise<Record<string, unknown>>;

const ctx = (query: NextPageContext['query']) =>
  ({ query, req: undefined, res: undefined } as unknown as NextPageContext);

describe('stay detail getInitialProps', () => {
  beforeEach(() => jest.mocked(api.get).mockClear());

  // A client-side push to /bookings/<id> follows the next.config redirect but
  // drops :slug, so this page ran with an empty query and fetched
  // /stays/undefined and /booking/undefined.
  it('does not fetch a stay when the route param is missing', async () => {
    const props = await getInitialProps(ctx({}));

    const urls = jest.mocked(api.get).mock.calls.map(([url]) => url);
    expect(urls.some((url) => /undefined/.test(String(url)))).toBe(false);
    expect(urls.some((url) => /^\/(stays|booking)\//.test(String(url)))).toBe(
      false,
    );
    expect(props.booking).toBeNull();
  });

  it('fetches the stay for a valid id', async () => {
    await getInitialProps(ctx({ slug: '6a8b2dd0d70758e3651fe31f' }));

    const urls = jest.mocked(api.get).mock.calls.map(([url]) => url);
    expect(urls).toContain('/stays/6a8b2dd0d70758e3651fe31f');
  });
});
