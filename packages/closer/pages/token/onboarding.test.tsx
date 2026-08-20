import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import { awardOnboardingCarrots } from '../../utils/tokenOnboarding.api';
import OnboardingPage from './onboarding';

jest.mock('../../components/Wallet', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet" />,
}));

jest.mock('../../components/WalletActions', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-actions" />,
}));

const disconnectedWallet = {
  isWalletConnected: false,
  isCorrectNetwork: false,
  hasSameConnectedAccount: false,
  account: null,
};
let mockWallet: Record<string, unknown> = { ...disconnectedWallet };

jest.mock('../../contexts/wallet/hooks', () => ({
  useWalletState: () => mockWallet,
}));

jest.mock('../../utils/tokenOnboarding.api', () => ({
  awardOnboardingCarrots: jest.fn(),
}));

jest.mock('../../utils/metrics', () => ({
  logMetric: jest.fn().mockResolvedValue(undefined),
}));

const patch = jest.fn().mockResolvedValue({});
const refetchUser = jest.fn().mockResolvedValue(undefined);
let mockUser: any = null;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: mockUser, refetchUser, isLoading: false }),
}));

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({ platform: { user: { patch } } }),
}));

const member = (
  settings: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
) => ({
  _id: 'user-1',
  settings,
  ...extra,
});

/** Everything but the last quest, so the wallet quest is the open one. */
const upToTheWalletQuest = {
  token_onboarding_progress: {
    completed: [
      'why-web3',
      'what-is-a-wallet',
      'create-wallet',
      'protect-the-phrase',
      'smart-contracts',
      'multisig',
    ],
  },
};

const claimButton = () =>
  screen.getByRole('button', { name: /^Claim/i });

describe('/token/onboarding', () => {
  const originalTokenSaleFlag = process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'true';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = originalTokenSaleFlag;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockWallet = { ...disconnectedWallet };
    mockUser = member();
    // jsdom has no scrolling; without a stub every claim logs "not implemented".
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
    (awardOnboardingCarrots as jest.Mock).mockResolvedValue({
      status: 'awarded',
    });
  });

  it('opens on the first quest with nothing earned yet', () => {
    renderWithNextIntl(<OnboardingPage />);

    expect(screen.getByText('Quest 1 of 7')).toBeInTheDocument();
    expect(screen.getByText('0 / 5 🥕')).toBeInTheDocument();
    expect(claimButton()).toBeDisabled();
    // Later quests stay shut until the one before them is claimed.
    expect(
      screen.getByRole('button', { name: /What a wallet actually is/ }),
    ).toBeDisabled();
  });

  it('advertises a fraction of a carrot per quest', () => {
    renderWithNextIntl(<OnboardingPage />);

    ['¼ 🥕', '½ 🥕', '1 🥕', '1¼ 🥕'].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('claims a quarter carrot, unlocks the next quest and stores the progress', async () => {
    renderWithNextIntl(<OnboardingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /the access token/ }),
    );
    expect(claimButton()).toBeEnabled();

    await userEvent.click(claimButton());

    await waitFor(() =>
      expect(screen.getByText('¼ / 5 🥕')).toBeInTheDocument(),
    );
    expect(screen.getByText('Quest 2 of 7')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /What a wallet actually is/ }),
    ).toBeEnabled();

    // Claiming moves on to the next quest, so reopen the first to see its state.
    await userEvent.click(
      screen.getByRole('button', { name: /Why we bother with web3/ }),
    );
    expect(screen.getByText('Claimed ¼ 🥕')).toBeInTheDocument();

    expect(awardOnboardingCarrots).toHaveBeenCalledTimes(1);
    expect(awardOnboardingCarrots).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'why-web3', carrots: 0.25 }),
    );
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('user-1', {
        settings: { token_onboarding_progress: { completed: ['why-web3'] } },
      }),
    );
    expect(
      window.localStorage.getItem('token-onboarding-progress-user-1'),
    ).toBe(JSON.stringify({ completed: ['why-web3'] }));
  });

  it('keeps the progress and says the carrots are coming when the award fails', async () => {
    (awardOnboardingCarrots as jest.Mock).mockResolvedValue({
      status: 'unavailable',
    });
    renderWithNextIntl(<OnboardingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /the access token/ }),
    );
    await userEvent.click(claimButton());

    await waitFor(() =>
      expect(screen.getByText('¼ / 5 🥕')).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Why we bother with web3/ }),
    );
    expect(screen.getByText('Claimed ¼ 🥕')).toBeInTheDocument();
    expect(
      screen.getByText(/carrots are recorded and will land in your balance/i),
    ).toBeInTheDocument();
  });

  it('resumes where the member left off, from the stored progress', () => {
    mockUser = member({
      token_onboarding_progress: {
        completed: ['why-web3', 'what-is-a-wallet'],
      },
    });

    renderWithNextIntl(<OnboardingPage />);

    expect(screen.getByText('¾ / 5 🥕')).toBeInTheDocument();
    expect(screen.getByText('Quest 3 of 7')).toBeInTheDocument();
    // The third quest is the open one, so its checklist gate is on screen.
    expect(
      screen.getByText(/I can see my address starting with 0x/),
    ).toBeInTheDocument();
  });

  it('holds a checklist gate shut until every box is ticked', async () => {
    mockUser = member({
      token_onboarding_progress: {
        completed: ['why-web3', 'what-is-a-wallet'],
      },
    });
    renderWithNextIntl(<OnboardingPage />);

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);

    await userEvent.click(boxes[0]);
    await userEvent.click(boxes[1]);
    expect(claimButton()).toBeDisabled();

    await userEvent.click(boxes[2]);
    expect(claimButton()).toBeEnabled();
  });

  it('scrolls the next quest up to just under the navigation', async () => {
    const scrollTo = jest.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    Object.defineProperty(window, 'scrollY', {
      value: 200,
      configurable: true,
    });
    const rect = jest
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 500 } as DOMRect);

    renderWithNextIntl(<OnboardingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /the access token/ }),
    );
    await userEvent.click(claimButton());

    // 500 in the viewport + 200 already scrolled - the 96px navigation gap.
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 604,
        behavior: 'smooth',
      }),
    );

    rect.mockRestore();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('unlocks the purchase only once all five carrots are earned', () => {
    mockUser = member({
      token_onboarding_progress: {
        completed: [
          'why-web3',
          'what-is-a-wallet',
          'create-wallet',
          'protect-the-phrase',
          'smart-contracts',
          'multisig',
          'connect-wallet',
        ],
      },
    });

    renderWithNextIntl(<OnboardingPage />);

    expect(screen.getByText('5 / 5 🥕')).toBeInTheDocument();
    expect(screen.getByText('All quests complete')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Buy tokens/i }),
    ).toBeEnabled();
  });

  describe('the connect-wallet quest', () => {
    const originalWalletFlag = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET;

    beforeAll(() => {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    });

    afterAll(() => {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = originalWalletFlag;
    });

    beforeEach(() => {
      mockUser = member(upToTheWalletQuest);
    });

    it('reads the wallet rather than asking the member to tick a box', () => {
      renderWithNextIntl(<OnboardingPage />);

      expect(screen.getByText('Quest 7 of 7')).toBeInTheDocument();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
      expect(
        screen.getByText('Wallet connected to this browser'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('wallet-actions')).toBeInTheDocument();
      expect(claimButton()).toBeDisabled();
    });

    it('stays shut while the wallet is on the wrong network', () => {
      mockUser = member(upToTheWalletQuest, {
        walletAddress: '0xabc',
      });
      mockWallet = {
        isWalletConnected: true,
        isCorrectNetwork: false,
        hasSameConnectedAccount: true,
        account: '0xabc',
      };

      renderWithNextIntl(<OnboardingPage />);

      expect(claimButton()).toBeDisabled();
    });

    it('stays shut when the connected address is not the saved one', () => {
      mockUser = member(upToTheWalletQuest, {
        walletAddress: '0xabc',
      });
      mockWallet = {
        isWalletConnected: true,
        isCorrectNetwork: true,
        hasSameConnectedAccount: false,
        account: '0xdef',
      };

      renderWithNextIntl(<OnboardingPage />);

      expect(claimButton()).toBeDisabled();
      expect(
        screen.getByText(/different from the one saved in your profile/i),
      ).toBeInTheDocument();
    });

    it('opens the claim by itself once the wallet checks out', async () => {
      mockUser = member(upToTheWalletQuest, {
        walletAddress: '0xabc',
      });
      mockWallet = {
        isWalletConnected: true,
        isCorrectNetwork: true,
        hasSameConnectedAccount: true,
        account: '0xabc',
      };

      renderWithNextIntl(<OnboardingPage />);

      expect(claimButton()).toBeEnabled();
      expect(screen.queryByTestId('wallet-actions')).not.toBeInTheDocument();

      await userEvent.click(claimButton());

      await waitFor(() =>
        expect(screen.getByText('5 / 5 🥕')).toBeInTheDocument(),
      );
      expect(
        screen.getByRole('button', { name: /Buy tokens/i }),
      ).toBeEnabled();
    });

    it('falls back to a checklist where wallets cannot be connected', () => {
      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'false';

      renderWithNextIntl(<OnboardingPage />);

      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
      expect(screen.queryByTestId('wallet-actions')).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET = 'true';
    });
  });
});
