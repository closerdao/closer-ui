import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import StayPaymentFinalisingNotice, {
  FINALISING_POLL_MS,
  FINALISING_WINDOW_MS,
} from './stayPaymentFinalisingNotice';

describe('StayPaymentFinalisingNotice', () => {
  afterEach(() => jest.useRealTimers());

  it('says the page updates itself and offers refresh, not retry', async () => {
    const onRefresh = jest.fn().mockResolvedValue(null);
    renderWithNextIntl(
      <StayPaymentFinalisingNotice stayId="stay_1" onRefresh={onRefresh} />,
    );

    expect(
      screen.getByText(/updates automatically within 15 minutes/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /try again|retry|pay/i }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('re-reads the stay on its own', () => {
    jest.useFakeTimers();
    const onRefresh = jest.fn().mockResolvedValue(null);
    renderWithNextIntl(
      <StayPaymentFinalisingNotice stayId="stay_1" onRefresh={onRefresh} />,
    );

    act(() => {
      jest.advanceTimersByTime(FINALISING_POLL_MS * 2);
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('stops polling after 15 minutes and points to support', async () => {
    jest.useFakeTimers();
    const onRefresh = jest.fn().mockResolvedValue(null);
    renderWithNextIntl(
      <StayPaymentFinalisingNotice stayId="stay_1" onRefresh={onRefresh} />,
    );

    act(() => {
      jest.advanceTimersByTime(FINALISING_WINDOW_MS);
    });
    const polls = onRefresh.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(FINALISING_POLL_MS * 4);
    });

    expect(onRefresh).toHaveBeenCalledTimes(polls);
    expect(
      screen.getByText(/contact support with booking stay_1/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
