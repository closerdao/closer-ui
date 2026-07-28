import { render, screen, waitFor } from '@testing-library/react';
import { fromJS } from 'immutable';

import { useLiveBookingConfig } from './useLiveBookingConfig';

/**
 * Regression test for the read-after-dispatch race.
 *
 * The first implementation of this hook awaited `platform.config.getOne(...)`
 * and then read the value back out of the store via `platform.config.findOne`.
 * That can never work: `findOne` reads `stateRef.current`, which the provider
 * assigns in its render body (`contexts/platform/platform.js:311-312,322`),
 * whereas `getOne` dispatches inside a `.then()` (`:384`). The await
 * continuation is a microtask; React's re-render is a macrotask. So the store
 * is always still empty at that point and the live value was never applied —
 * the page fired an extra uncached request and rendered the stale snapshot.
 *
 * These tests therefore model exactly that condition: `getOne` resolves with a
 * populated action while `findOne` returns `undefined`, as it does in a real
 * provider. Any implementation that reads through the store fails here.
 */

const mockAuth: { isAuthenticated: boolean } = { isAuthenticated: true };
jest.mock('../contexts/auth', () => ({
  useAuth: () => mockAuth,
}));

const getOne = jest.fn();
const findOne = jest.fn();

/**
 * The context value is built once and reused, mirroring the real provider,
 * where `platform` is a `useMemo(..., [])` (`platform.js:941`). That stability
 * matters: the hook's effect keys on `platform`, so a stub that returned a
 * fresh object per render would re-fire the fetch on every render and mask the
 * once-per-mount guarantee this test exists to pin.
 */
const platformValue = { platform: { config: { getOne, findOne } } };
jest.mock('../contexts/platform', () => ({
  usePlatform: () => platformValue,
}));

/** Defaults-merged snapshot, as `configCached` hands it to a page. */
const SNAPSHOT = { enabled: true, pickUpEnabled: true, minDuration: 1 };

/** The action `getOne` resolves with — `results` is an Immutable Map. */
const successAction = (value: Record<string, unknown>) => ({
  type: 'GET_ONE_SUCCESS',
  id: 'booking',
  model: 'config',
  results: fromJS({ _id: 'booking', slug: 'booking', value }),
});

const Probe = () => {
  const bookingConfig = useLiveBookingConfig(SNAPSHOT);
  return (
    <div>
      <span data-testid="pickup">{String(bookingConfig?.pickUpEnabled)}</span>
      <span data-testid="enabled">{String(bookingConfig?.enabled)}</span>
      <span data-testid="minDuration">
        {String(bookingConfig?.minDuration)}
      </span>
    </div>
  );
};

describe('useLiveBookingConfig — does not read back through the store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.isAuthenticated = true;
    // Exactly what a real provider does on the awaited continuation: the
    // reducer has not committed yet, so the store read misses.
    findOne.mockReturnValue(undefined);
    getOne.mockResolvedValue(
      successAction({ enabled: true, pickUpEnabled: false, minDuration: 10 }),
    );
  });

  it('applies the live value even though the store is still empty', async () => {
    render(<Probe />);

    // No flicker: the snapshot renders synchronously on first paint.
    expect(screen.getByTestId('pickup')).toHaveTextContent('true');

    await waitFor(() =>
      expect(screen.getByTestId('pickup')).toHaveTextContent('false'),
    );
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('minDuration')).toHaveTextContent('10');
    expect(findOne).not.toHaveBeenCalled();
  });

  it('requests the booking slug once, bypassing the store cache', async () => {
    render(<Probe />);

    await waitFor(() =>
      expect(screen.getByTestId('pickup')).toHaveTextContent('false'),
    );
    expect(getOne).toHaveBeenCalledTimes(1);
    expect(getOne).toHaveBeenCalledWith('booking', { force: true });
  });

  it('keeps the snapshot when the request rejects', async () => {
    getOne.mockRejectedValue(new Error('503'));

    render(<Probe />);

    await waitFor(() => expect(getOne).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('pickup')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('enabled')).toHaveTextContent('true');
    expect(screen.getByTestId('minDuration')).toHaveTextContent('1');
  });

  it('keeps the snapshot when the error path resolves without results', async () => {
    // `getOne`'s `.catch` returns `dispatch(...)`, which has no `results` — so
    // a failure surfaces as a resolved action, not a rejection.
    getOne.mockResolvedValue({ type: 'GET_ONE_ERROR', error: new Error('x') });

    render(<Probe />);

    await waitFor(() => expect(getOne).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('pickup')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('minDuration')).toHaveTextContent('1');
  });

  it('keeps the snapshot when the live doc has an empty value', async () => {
    // An empty value merged over defaults would yield `enabled: false` and
    // blank every page behind FeatureNotEnabled.
    getOne.mockResolvedValue(successAction({}));

    render(<Probe />);

    await waitFor(() => expect(getOne).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByTestId('enabled')).toHaveTextContent('true'),
    );
    expect(screen.getByTestId('pickup')).toHaveTextContent('true');
  });

  it('adds no request for unauthenticated visitors', async () => {
    mockAuth.isAuthenticated = false;

    render(<Probe />);

    await waitFor(() =>
      expect(screen.getByTestId('pickup')).toHaveTextContent('true'),
    );
    expect(getOne).not.toHaveBeenCalled();
  });
});
