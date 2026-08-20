import { act, renderHook } from '@testing-library/react';

import { useVotingPeriodEnd } from '../useVotingPeriodEnd';

const MINUTE_MS = 60 * 1000;

const inMinutes = (minutes: number) =>
  new Date(Date.now() + minutes * MINUTE_MS).toISOString();

describe('useVotingPeriodEnd', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires once the end date passes while the page stays open', () => {
    const onEnd = jest.fn();

    renderHook(() => useVotingPeriodEnd(inMinutes(2), onEnd));

    expect(onEnd).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2 * MINUTE_MS + 1000);
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('does not fire for a voting period that already ended', () => {
    const onEnd = jest.fn();

    renderHook(() => useVotingPeriodEnd(inMinutes(-5), onEnd));

    act(() => {
      jest.advanceTimersByTime(10 * MINUTE_MS);
    });

    expect(onEnd).not.toHaveBeenCalled();
  });

  it('calls the latest callback, not the one from the render that scheduled it', () => {
    const stale = jest.fn();
    const fresh = jest.fn();

    const { rerender } = renderHook(
      ({ onEnd }) => useVotingPeriodEnd(inMinutes(2), onEnd),
      { initialProps: { onEnd: stale } },
    );

    rerender({ onEnd: fresh });

    act(() => {
      jest.advanceTimersByTime(2 * MINUTE_MS + 1000);
    });

    expect(stale).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledTimes(1);
  });

  it('ignores a missing or unparseable end date', () => {
    const onEnd = jest.fn();

    renderHook(() => useVotingPeriodEnd(undefined, onEnd));
    renderHook(() => useVotingPeriodEnd('not a date', onEnd));

    act(() => {
      jest.advanceTimersByTime(10 * MINUTE_MS);
    });

    expect(onEnd).not.toHaveBeenCalled();
  });
});
