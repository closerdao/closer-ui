import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { unlinkWallet } from '../utils/user';
import ConnectedWallet from './ConnectedWallet';

const disconnect = jest.fn(async () => undefined);
const refetchUser = jest.fn(async () => undefined);

jest.mock('@reown/appkit/react', () => ({
  useDisconnect: () => ({ disconnect }),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: () => ({
    user: {
      email: 'admin@example.test',
      roles: ['admin'],
      walletAddress: '0x1111111111111111111111111111111111111111',
    },
    refetchUser,
  }),
}));

jest.mock('../utils/user', () => ({
  unlinkWallet: jest.fn(async () => ({})),
}));

jest.mock('./display/walletDisplay', () => () => null);

describe('ConnectedWallet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('unlinks the signed-in user by email and disconnects the wallet', async () => {
    render(<ConnectedWallet />);
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(disconnect).toHaveBeenCalled());
    expect(unlinkWallet).toHaveBeenCalledWith({ email: 'admin@example.test' });
    expect(refetchUser).toHaveBeenCalled();
  });

  it('still disconnects the wallet when the unlink fails', async () => {
    jest.mocked(unlinkWallet).mockRejectedValueOnce(new Error('nope'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<ConnectedWallet />);
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(disconnect).toHaveBeenCalled());
  });
});
