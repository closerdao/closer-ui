import { screen } from '@testing-library/react';

import type { CitizenQuestsState } from '../../hooks/useCitizenQuests';
import { renderWithNextIntl } from '../../test/utils';
import CustomCitizenshipStatus from './CustomCitizenshipStatus';

const authState: { user: Record<string, unknown> | null } = { user: null };

jest.mock('../../contexts/auth', () => ({
  useAuth: () => authState,
}));

const questsState: CitizenQuestsState = {
  tokensRequired: 30,
  minVouches: 3,
  minStayDuration: 14,
  isSpaceHostVouchRequired: true,
  hasStayedForMinDuration: true,
  totalStayDays: 30,
  presenceProgress: 1,
  isVouched: false,
  vouchCount: 1,
  ownsRequiredTokens: false,
  isTokensComplete: false,
  hasNoReports: true,
  isEligible: false,
  tokensProgress: 0.4,
  openFinanceApplications: [],
  financedTokens: 0,
  isTokensCoveredByFinancePlan: false,
  balanceTotal: 12,
  proofOfPresence: 0,
  isWalletConnected: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  hasLiveWalletBalances: false,
  application: {
    ownsRequiredTokens: false,
    why: 'I want to belong here',
    hasSelectedTokenIntent: false,
    intent: {
      iWantToApply: false,
      iWantToBuyTokens: false,
      iWantToFinanceTokens: false,
    },
  },
  updateApplication: jest.fn(),
  isMember: false,
};

jest.mock('../../hooks/useCitizenQuests', () => ({
  useCitizenQuests: () => questsState,
}));

describe('CustomCitizenshipStatus', () => {
  afterEach(() => {
    authState.user = null;
    questsState.proofOfPresence = 0;
    questsState.hasLiveWalletBalances = false;
    questsState.ownsRequiredTokens = false;
    questsState.balanceTotal = 12;
  });

  it('shows the call to action and benefits to a visitor who has not applied', () => {
    renderWithNextIntl(
      <CustomCitizenshipStatus
        content={{ items: ['Live at utility cost', 'Vote on proposals'] }}
      />,
    );

    expect(screen.getByText('Become a citizen')).toBeInTheDocument();
    expect(screen.getByText('Live at utility cost')).toBeInTheDocument();
    expect(screen.getByText('Vote on proposals')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Become citizen' }),
    ).toHaveAttribute('href', '/citizenship/why');
  });

  it('shows the quests and a way back into the flow when an application is in progress', () => {
    authState.user = {
      _id: 'user-1',
      roles: ['default'],
      citizenship: { why: 'I want to belong here' },
    };

    renderWithNextIntl(<CustomCitizenshipStatus />);

    expect(screen.getByText('Your citizenship quests')).toBeInTheDocument();
    expect(screen.getByText('Collect Presence')).toBeInTheDocument();
    expect(screen.getByText('Hold Tokens')).toBeInTheDocument();
    expect(screen.getByText('Get Vouched')).toBeInTheDocument();
    expect(screen.getByText('0 of 30 tokens')).toBeInTheDocument();
    expect(screen.getByText('30 of 14 nights stayed')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continue your application' }),
    ).toHaveAttribute('href', '/citizenship/validation');
  });

  it('reports the tokens quest as complete once the wallet holds enough', () => {
    authState.user = {
      _id: 'user-1',
      roles: ['default'],
      citizenship: { why: 'I want to belong here' },
    };
    questsState.balanceTotal = 42;
    questsState.ownsRequiredTokens = true;
    questsState.hasLiveWalletBalances = true;

    renderWithNextIntl(<CustomCitizenshipStatus />);

    expect(screen.getByText('You hold 42 tokens')).toBeInTheDocument();
    // The presence quest is complete in this fixture too, so tokens makes two.
    expect(screen.getAllByText('✓ Complete')).toHaveLength(2);
    expect(screen.queryByText('42 of 30 tokens')).not.toBeInTheDocument();
  });

  it('shows the citizen-since date with $Presence and $Sweat balances', () => {
    authState.user = {
      _id: 'user-1',
      roles: ['member'],
      citizenship: { createdAt: '2024-06-14T00:00:00.000Z' },
      stats: { wallet: { presence: 42, sweat: 7.5 } },
    };

    renderWithNextIntl(<CustomCitizenshipStatus />);

    expect(screen.getByText('You are a citizen')).toBeInTheDocument();
    expect(
      screen.getByText('You have been a citizen since June 2024.'),
    ).toBeInTheDocument();
    expect(screen.getByText('$Presence')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('$Sweat')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
    expect(
      screen.getByText(
        'These are cached balances and may be out of date. Connect your wallet to see live numbers.',
      ),
    ).toBeInTheDocument();
  });

  it('prefers the on-chain $Presence balance when the wallet is connected', () => {
    authState.user = {
      _id: 'user-1',
      roles: ['member'],
      citizenship: { createdAt: '2024-06-14T00:00:00.000Z' },
      stats: { wallet: { presence: 42, sweat: 7.5 } },
    };
    questsState.proofOfPresence = 55;
    questsState.hasLiveWalletBalances = true;

    renderWithNextIntl(<CustomCitizenshipStatus />);

    expect(screen.getByText('55')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        '$Presence is live from your connected wallet. $Sweat is a cached balance and may be out of date.',
      ),
    ).toBeInTheDocument();
  });

  it('hides the balances when the block setting is off', () => {
    authState.user = {
      _id: 'user-1',
      roles: ['citizen'],
      citizenship: { createdAt: '2024-06-14T00:00:00.000Z' },
      stats: { wallet: { presence: 42, sweat: 7.5 } },
    };

    renderWithNextIntl(
      <CustomCitizenshipStatus settings={{ showBalances: false }} />,
    );

    expect(screen.getByText('You are a citizen')).toBeInTheDocument();
    expect(screen.queryByText('$Presence')).not.toBeInTheDocument();
    expect(screen.queryByText('$Sweat')).not.toBeInTheDocument();
  });
});
