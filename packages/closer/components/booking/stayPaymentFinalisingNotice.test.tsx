import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import StayPaymentFinalisingNotice, {
  FINALISING_POLL_MS,
} from './stayPaymentFinalisingNotice';

describe('StayPaymentFinalisingNotice', () => {
  afterEach(() => jest.useRealTimers());

  it('says the page updates itself and offers refresh, not retry', async () => {
    const onRefresh = jest.fn().mockResolvedValue(null);
    renderWithNextIntl(<StayPaymentFinalisingNotice onRefresh={onRefresh} />);

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
    renderWithNextIntl(<StayPaymentFinalisingNotice onRefresh={onRefresh} />);

    act(() => {
      jest.advanceTimersByTime(FINALISING_POLL_MS * 2);
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});
