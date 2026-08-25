import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../test/utils';
import { Village } from '../types/village';
import {
  deployVillageToCloser,
  isVillageSubdomainTaken,
} from '../utils/village.utils';
import VillageDeployModal from './VillageDeployModal';

// The modal owns the interaction — validation, availability, the request —
// while the network layer is what these mocks stand in for.
jest.mock('../utils/village.utils', () => {
  const actual = jest.requireActual('../utils/village.utils');
  return {
    ...actual,
    isVillageSubdomainTaken: jest.fn(() => Promise.resolve(false)),
    deployVillageToCloser: jest.fn(() =>
      Promise.resolve({ _id: 'v1', slug: 'tdf' }),
    ),
  };
});

const mockedIsTaken = isVillageSubdomainTaken as jest.Mock;
const mockedDeploy = deployVillageToCloser as jest.Mock;

const village = {
  _id: 'v1',
  name: 'Traditional Dream Factory',
  closer: false,
  description: '',
  tags: [],
  country: 'PT',
  coords: [-8.6, 40.6],
  status: 'active',
} as unknown as Village;

const renderModal = (onDeployed = jest.fn(), onClose = jest.fn()) => {
  renderWithNextIntl(
    <VillageDeployModal
      village={village}
      onClose={onClose}
      onDeployed={onDeployed}
    />,
  );
  return { onDeployed, onClose };
};

describe('VillageDeployModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIsTaken.mockResolvedValue(false);
    mockedDeploy.mockResolvedValue({ _id: 'v1', slug: 'tdf' });
  });

  it('opens on an address suggested from the village and deploys it', async () => {
    const user = userEvent.setup();
    const { onDeployed } = renderModal();

    const input = screen.getByLabelText('Your address');
    expect(input).toHaveValue('traditional-dream-factory');

    await user.clear(input);
    await user.type(input, 'TDF Village');
    // Typed input is sanitized live into a hostname-shaped slug.
    expect(input).toHaveValue('tdf-village');

    await user.click(
      screen.getByRole('button', { name: 'Request deployment' }),
    );

    await waitFor(() => {
      expect(mockedDeploy).toHaveBeenCalledWith('v1', 'tdf-village');
    });
    expect(mockedIsTaken).toHaveBeenCalledWith('tdf-village', 'v1');
    expect(onDeployed).toHaveBeenCalledWith({ _id: 'v1', slug: 'tdf' });
  });

  it('rejects an address another village already answers to', async () => {
    const user = userEvent.setup();
    mockedIsTaken.mockResolvedValue(true);
    const { onDeployed } = renderModal();

    await user.click(
      screen.getByRole('button', { name: 'Request deployment' }),
    );

    await waitFor(() => {
      expect(
        screen.getByText('That address is already taken — try another.'),
      ).toBeInTheDocument();
    });
    expect(mockedDeploy).not.toHaveBeenCalled();
    expect(onDeployed).not.toHaveBeenCalled();
  });

  it('rejects an address that cannot be a subdomain', async () => {
    const user = userEvent.setup();
    renderModal();

    const input = screen.getByLabelText('Your address');
    await user.clear(input);
    await user.type(input, 'ab');

    await user.click(
      screen.getByRole('button', { name: 'Request deployment' }),
    );

    expect(
      await screen.findByText(/Use 3–30 lowercase letters/),
    ).toBeInTheDocument();
    expect(mockedIsTaken).not.toHaveBeenCalled();
    expect(mockedDeploy).not.toHaveBeenCalled();
  });
});
