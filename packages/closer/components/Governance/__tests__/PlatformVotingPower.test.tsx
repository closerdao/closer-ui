import { render, screen } from '@testing-library/react';

import { useVotingPowerSupply } from '../../../hooks/useVotingPowerSupply';
import PlatformVotingPower from '../PlatformVotingPower';

jest.mock('../../../hooks/useVotingPowerSupply');
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useFormatter: () => ({
    number: (value: number) => value.toLocaleString('en-US'),
  }),
}));

const mockedHook = useVotingPowerSupply as jest.MockedFunction<
  typeof useVotingPowerSupply
>;

type VotingPower = ReturnType<typeof useVotingPowerSupply>;

const buildSupply = (over: Partial<VotingPower> = {}): VotingPower =>
  ({
    tdf: 1000,
    presence: 500,
    sweat: 100,
    breakdown: [
      { key: 'tdf', label: '$TDF', supply: 1000, multiplier: 1, votes: 1000 },
      {
        key: 'presence',
        label: '$Presence',
        supply: 500,
        multiplier: 1,
        votes: 500,
      },
      { key: 'sweat', label: '$Sweat', supply: 100, multiplier: 5, votes: 500 },
    ],
    total: 2000,
    isLoading: false,
    ...over,
  } as VotingPower);

describe('PlatformVotingPower', () => {
  beforeEach(() => {
    mockedHook.mockReset();
  });

  it('shows the platform total and each token share of it', () => {
    mockedHook.mockReturnValue(buildSupply());

    render(<PlatformVotingPower />);

    expect(screen.getByText('governance_platform_total_votes')).toBeVisible();
    expect(screen.getByText('2,000')).toBeVisible();

    expect(screen.getByText('$TDF')).toBeVisible();
    expect(screen.getByText('1,000 (50%)')).toBeVisible();
    expect(screen.getByText('$Presence')).toBeVisible();
    // $Sweat votes five times per token, so its label carries the multiplier.
    expect(screen.getByText('$Sweat × 5')).toBeVisible();
    expect(screen.getAllByText('500 (25%)')).toHaveLength(2);
  });

  it('renders nothing when the platform voting power is unknown', () => {
    mockedHook.mockReturnValue(buildSupply({ breakdown: [], total: null }));

    const { container } = render(<PlatformVotingPower />);

    expect(container).toBeEmptyDOMElement();
  });
});
