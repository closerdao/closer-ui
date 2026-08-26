import { screen, waitFor } from '@testing-library/react';

import { blockchainConfig } from '../../config_blockchain';
import { getTokenOnboardingQuests } from '../../constants/tokenOnboardingQuests';
import type { TokenConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getMaxFinancingMonths } from '../../utils/tokenFinancing';
import { createSection } from '../PageEditor/blockDefaults';
import { renderWithNextIntl } from '../../test/utils';
import CustomTokenContractsPromo from './CustomTokenContractsPromo';
import CustomTokenFinancePromo from './CustomTokenFinancePromo';
import CustomTokenOnboardingPromo from './CustomTokenOnboardingPromo';
import { CustomTokenBuyPromo } from './CustomTokenPagePromo';

const authState: { user: Record<string, unknown> | null } = { user: null };

jest.mock('../../contexts/auth', () => ({
  useAuth: () => authState,
}));

const getTotalCostWithoutWallet = jest.fn(async () => 2670);

jest.mock('../../hooks/useBuyTokens', () => ({
  useBuyTokens: () => ({ getTotalCostWithoutWallet }),
}));

const sectionContent = (type: Parameters<typeof createSection>[0]) =>
  (createSection(type).data as { content: Record<string, unknown> }).content;

const questIds = () =>
  getTokenOnboardingQuests({
    tokenSymbol: 'TDF',
    platformName: 'TDF',
    networkName: 'Celo',
    gasToken: 'CELO',
    semanticUrl: 'example.com',
    canConnectWallet: process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true',
  }).map((quest) => quest.id);

describe('tokenBuy promo block', () => {
  it('promotes the buy flow and links to it by default', () => {
    const content = sectionContent('tokenBuy');
    renderWithNextIntl(<CustomTokenBuyPromo content={content} />);
    const cta = screen.getByRole('link', { name: String(content.ctaText) });
    expect(cta.getAttribute('href')).toBe('/token/before-you-begin');
    expect(
      screen.getByRole('heading', { name: String(content.title) }),
    ).toBeTruthy();
  });
});

describe('tokenContracts promo block', () => {
  it('lists the main contracts with explorer links and links to the page', () => {
    renderWithNextIntl(
      <CustomTokenContractsPromo content={sectionContent('tokenContracts')} />,
    );

    const tokenAddress = blockchainConfig.BLOCKCHAIN_DAO_TOKEN.address;
    const explorerLink = screen.getByTitle(tokenAddress);
    expect(explorerLink.getAttribute('href')).toBe(
      `${blockchainConfig.BLOCKCHAIN_EXPLORER_URL}/address/${tokenAddress}`,
    );
    expect(explorerLink.getAttribute('target')).toBe('_blank');
    expect(
      screen
        .getByRole('link', { name: 'Open the contracts page' })
        .getAttribute('href'),
    ).toBe('/token/contracts');
  });
});

describe('tokenFinance promo block', () => {
  it('quotes down payment and monthly payment for the chosen amount', async () => {
    renderWithNextIntl(
      <CustomTokenFinancePromo content={sectionContent('tokenFinance')} />,
    );

    await waitFor(() =>
      expect(getTotalCostWithoutWallet).toHaveBeenCalledWith('10'),
    );
    // Default config: 10% down on €2670 = €267.
    await screen.findByText('€267.00');
    expect(screen.getByLabelText('Tokens')).toBeTruthy();
    const slider = screen.getByLabelText('Duration');
    expect(slider.getAttribute('type')).toBe('range');
    // The slider starts at the configured ceiling, same as the finance form.
    const months = getMaxFinancingMonths(
      getCachedConfig('token') as TokenConfig | null,
    );
    expect(
      screen
        .getByRole('link', { name: 'Apply for financing' })
        .getAttribute('href'),
    ).toBe(`/token/finance?tokens=10&months=${months}`);
  });
});

describe('tokenOnboarding promo block', () => {
  afterEach(() => {
    authState.user = null;
    window.localStorage.clear();
  });

  it('shows the pitch and start CTA to signed-out visitors', () => {
    const content = sectionContent('tokenOnboarding');
    renderWithNextIntl(<CustomTokenOnboardingPromo content={content} />);
    expect(
      screen.getByRole('heading', { name: String(content.title) }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: String(content.ctaText) })
        .getAttribute('href'),
    ).toBe('/token/onboarding');
  });

  it('greets members with a linked wallet differently', () => {
    authState.user = { _id: 'u1', walletAddress: '0xabc', settings: {} };
    renderWithNextIntl(
      <CustomTokenOnboardingPromo content={sectionContent('tokenOnboarding')} />,
    );
    expect(
      screen.getByText(/wallet is already linked/i),
    ).toBeTruthy();
  });

  it('shows progress and a continue CTA mid-flow', async () => {
    const ids = questIds();
    authState.user = {
      _id: 'u1',
      settings: {
        token_onboarding_progress: { completed: ids.slice(0, 2) },
      },
    };
    renderWithNextIntl(
      <CustomTokenOnboardingPromo content={sectionContent('tokenOnboarding')} />,
    );
    await screen.findByRole('link', { name: 'Continue onboarding' });
    expect(
      screen.getByText(new RegExp(`2 of ${ids.length} quests done`)),
    ).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  it('shows the completed state once every quest is claimed', async () => {
    authState.user = {
      _id: 'u1',
      settings: {
        token_onboarding_progress: { completed: questIds() },
      },
    };
    renderWithNextIntl(
      <CustomTokenOnboardingPromo content={sectionContent('tokenOnboarding')} />,
    );
    await screen.findByRole('heading', { name: 'Onboarding complete' });
    expect(
      screen
        .getByRole('link', { name: 'Revisit onboarding' })
        .getAttribute('href'),
    ).toBe('/token/onboarding');
  });
});
