import { render, screen } from '@testing-library/react';

import {
  getResultCelebrationStorageKey,
  TWENTY_FOUR_HOURS_MS,
} from '../../../utils/proposalStatus';
import ProposalResultCelebration from '../ProposalResultCelebration';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('../GovernanceConfetti', () => () => null);

const PROPOSAL_ID = 'proposal-1';
const justEnded = () => new Date(Date.now() - 60 * 1000).toISOString();

describe('ProposalResultCelebration', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('does not celebrate or remember a yes-majority before the result is frozen', () => {
    render(
      <ProposalResultCelebration
        proposalId={PROPOSAL_ID}
        endDate={justEnded()}
        effectiveStatus="passed"
      />,
    );

    expect(
      screen.queryByRole('dialog', {
        name: 'governance_result_passed_title',
      }),
    ).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(getResultCelebrationStorageKey(PROPOSAL_ID)),
    ).toBeNull();
  });

  it('does not celebrate a live failed tally before finalize', () => {
    render(
      <ProposalResultCelebration
        proposalId={PROPOSAL_ID}
        endDate={justEnded()}
        effectiveStatus="failed"
        forceShow
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(getResultCelebrationStorageKey(PROPOSAL_ID)),
    ).toBeNull();
  });

  it('celebrates a frozen pass and remembers it', () => {
    render(
      <ProposalResultCelebration
        proposalId={PROPOSAL_ID}
        endDate={justEnded()}
        effectiveStatus="passed"
        isFinalized
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'governance_result_passed_title' }),
    ).toBeInTheDocument();
    expect(
      window.localStorage.getItem(getResultCelebrationStorageKey(PROPOSAL_ID)),
    ).toBe('true');
  });

  it('celebrates a frozen rejection', () => {
    render(
      <ProposalResultCelebration
        proposalId={PROPOSAL_ID}
        endDate={justEnded()}
        effectiveStatus="failed"
        isFinalized
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'governance_result_failed_title' }),
    ).toBeInTheDocument();
  });

  it('does not celebrate outside the result window', () => {
    render(
      <ProposalResultCelebration
        proposalId={PROPOSAL_ID}
        endDate={new Date(Date.now() - TWENTY_FOUR_HOURS_MS - 1).toISOString()}
        effectiveStatus="passed"
        isFinalized
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
