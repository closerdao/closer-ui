import { screen, waitFor } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { getAutoCancelExemptStays } from '../../utils/stays.api';
import AutoCancelExemptStays from './AutoCancelExemptStays';

jest.mock('../../utils/stays.api', () => ({
  getAutoCancelExemptStays: jest.fn(),
}));

const mockedExempt = getAutoCancelExemptStays as jest.Mock;

describe('AutoCancelExemptStays', () => {
  it('lists each exempt stay with the reason, linking to the stay', async () => {
    mockedExempt.mockResolvedValue([
      {
        _id: 'stay_1',
        status: 'confirmed',
        start: '2027-01-10T00:00:00.000Z',
        autoCancelExemption: {
          action: 'do-not-auto-cancel',
          at: '2026-09-20T10:00:00.000Z',
          by: 'host_1',
          reason: 'Paying cash at the door',
        },
      },
    ]);
    renderWithNextIntl(<AutoCancelExemptStays />);

    expect(
      await screen.findByText('Kept from auto-cancel (1)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '10 Jan' })).toHaveAttribute(
      'href',
      '/stay/stay_1',
    );
    expect(screen.getByText(/Paying cash at the door/)).toBeInTheDocument();
  });

  it('renders nothing when no stay is exempt, or the caller is not a host', async () => {
    mockedExempt.mockRejectedValue(new Error('Forbidden'));
    const { container } = renderWithNextIntl(<AutoCancelExemptStays />);

    await waitFor(() => expect(mockedExempt).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
