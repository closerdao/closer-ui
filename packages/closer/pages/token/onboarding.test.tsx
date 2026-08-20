import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import { awardOnboardingCarrots } from '../../utils/tokenOnboarding.api';
import OnboardingPage from './onboarding';

jest.mock('../../components/Wallet', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet" />,
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

const member = (settings: Record<string, unknown> = {}) => ({
  _id: 'user-1',
  settings,
});

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
    mockUser = member();
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
});
