import type { NextPageContext } from 'next';

import StayBookingSummaryPage from '../pages/stay/[slug]/index';
import api from '../utils/api.js';

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

const STAY_ID = '6a8b2dd0d70758e3651fe31f';

const getInitialProps = StayBookingSummaryPage.getInitialProps as (
  context: NextPageContext,
) => Promise<Record<string, unknown>>;

const buildContext = (query: NextPageContext['query']) =>
  ({ query, req: undefined, res: undefined }) as unknown as NextPageContext;

const requestedUrls = () =>
  jest.mocked(api.get).mock.calls.map(([url]) => String(url));

describe('stay detail getInitialProps', () => {
  beforeEach(() => jest.mocked(api.get).mockClear());

  it('does not fetch a stay when the route param is missing', async () => {
    const props = await getInitialProps(buildContext({}));

    expect(
      requestedUrls().filter((url) => /^\/(stays|booking)\//.test(url)),
    ).toEqual([]);
    expect(props.booking).toBeNull();
  });

  it('fetches the stay and booking for a valid id', async () => {
    await getInitialProps(buildContext({ slug: STAY_ID }));

    expect(requestedUrls()).toEqual(
      expect.arrayContaining([`/stays/${STAY_ID}`, `/booking/${STAY_ID}`]),
    );
  });
});
