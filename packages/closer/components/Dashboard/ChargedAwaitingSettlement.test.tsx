import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { getChargedAwaitingSettlementCount } from '../../utils/stays.api';
import ChargedAwaitingSettlement from './ChargedAwaitingSettlement';

jest.mock('../../utils/stays.api', () => ({
  getChargedAwaitingSettlementCount: jest.fn(),
}));

const mockedCount = getChargedAwaitingSettlementCount as jest.Mock;

describe('ChargedAwaitingSettlement', () => {
  it('shows how many stays Stripe charged without a recorded payment', async () => {
    mockedCount.mockResolvedValue(2);
    renderWithNextIntl(<ChargedAwaitingSettlement />);

    expect(
      await screen.findByText('Charged, awaiting settlement (2)'),
    ).toBeInTheDocument();
  });

  it.each([
    ['every charge is settled', () => mockedCount.mockResolvedValue(0)],
    [
      'the caller is not a host',
      () => mockedCount.mockRejectedValue(new Error('Forbidden')),
    ],
  ])('renders nothing when %s', async (_, arrange) => {
    arrange();
    const { container } = renderWithNextIntl(<ChargedAwaitingSettlement />);

    await waitFor(() => expect(mockedCount).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
