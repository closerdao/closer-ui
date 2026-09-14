import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  API_PROOFS_FIXTURE,
  MAINNET_ATTESTATION_CALLDATA,
  MATCHING_ATTESTATION_CALLDATA,
} from '../../../utils/__fixtures__/proposalAttestation.fixture';
import ProposalAttestation from '../ProposalAttestation';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values
      ? `${key} ${Object.values(values).join(' ')}`
      : key,
}));

const { votes, proofs, proofsHash } = API_PROOFS_FIXTURE;

const TX_HASH =
  '0x9a3c1f7e2b8d40516c7f9e0a1b2c3d4e5f60718293a4b5c6d7e8f9012a3b4c5d';

const lockState = (over: Record<string, any> = {}) =>
  ({
    finalizedAt: '2026-08-20T21:50:00.000Z',
    finalizedBy: 'someone',
    finalizedEarly: false,
    outcome: 'passed',
    results: { yes: 330.25, no: 504.123456, abstain: 0.5 },
    quorum: 130.068181,
    quorumMet: true,
    majority: false,
    totalWeight: 834.873456,
    voterCount: 4,
    proofAlgorithm: 'sha256',
    proofsHash,
    proofs,
    ...over,
  }) as any;

const proposal = {
  _id: '6a78c77a0dab8e84237a917f',
  slug: 'adding-a-deeper-borehole-above-the-garden-to-maint',
  votes,
} as any;

const onChain = (over: Record<string, any> = {}) => ({
  chainId: 42220,
  from: '0xfrom',
  to: '0xfrom',
  txHash: TX_HASH,
  blockNumber: 31904221,
  status: 'confirmed',
  attempts: 1,
  ...over,
});

const mockRpc = (input: string | null) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      jsonrpc: '2.0',
      id: 1,
      result: input
        ? { input, blockNumber: '0x1e6ce9d' }
        : null,
    }),
  }) as any;
};

describe('ProposalAttestation', () => {
  beforeEach(() => {
    mockRpc(MATCHING_ATTESTATION_CALLDATA);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('the resting line', () => {
    it('stands as its own card', () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      expect(
        screen.getByRole('heading', {
          name: 'governance_verification',
        }),
      ).toBeVisible();
    });

    it('names the chain and block and links the transaction in words', () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      expect(
        screen.getByText('governance_attestation_recorded_line Celo 31,904,221'),
      ).toBeVisible();

      const link = screen.getByRole('link', {
        name: 'governance_attestation_view_transaction',
      });
      expect(link).toHaveAttribute(
        'href',
        `https://explorer.celo.org/mainnet/tx/${TX_HASH}`,
      );
    });

    it('shows the hash truncated with a copy button, not as the link', () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      expect(screen.getByText('0x9a3c1f7e…2a3b4c5d')).toBeVisible();
      expect(
        screen.getByRole('button', { name: 'governance_attestation_copy_tx' }),
      ).toBeVisible();
      expect(screen.queryByRole('link', { name: /0x9a3c/ })).toBeNull();
    });
  });

  describe('every on-chain state', () => {
    it.each([
      ['confirmed', onChain()],
      ['pending', onChain({ status: 'pending', blockNumber: undefined })],
      ['reverted', onChain({ status: 'reverted' })],
      ['failed', onChain({ status: 'failed' })],
      ['null', null],
    ])(
      'says the result stands when the attestation is %s',
      (_label: string, chain: ReturnType<typeof onChain> | null) => {
        render(
          <ProposalAttestation
            proposal={proposal}
            lockState={lockState({ onChain: chain })}
          />,
        );

        expect(
          screen.getByText('governance_attestation_result_stands'),
        ).toBeVisible();
      },
    );

    it('links a pending transaction, which already has a hash', () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({
            onChain: onChain({ status: 'pending', blockNumber: undefined }),
          })}
        />,
      );

      expect(
        screen.getByText('governance_attestation_pending_line Celo'),
      ).toBeVisible();
      expect(
        screen.getByRole('link', {
          name: 'governance_attestation_view_transaction',
        }),
      ).toBeVisible();
    });

    it.each([
      ['reverted', 'governance_attestation_reverted'],
      ['failed', 'governance_attestation_failed'],
    ])(
      'says %s plainly and links nothing that does not exist',
      (status: string, copy: string) => {
        render(
          <ProposalAttestation
            proposal={proposal}
            lockState={lockState({ onChain: onChain({ status }) })}
          />,
        );

        expect(screen.getByText(copy)).toBeVisible();
        expect(screen.queryByRole('link')).toBeNull();
      },
    );

    it('points at the proofs when there is no attestation at all', async () => {
      render(
        <ProposalAttestation proposal={proposal} lockState={lockState()} />,
      );

      expect(
        screen.getByText('governance_attestation_not_on_chain'),
      ).toBeVisible();

      fireEvent.click(
        screen.getByRole('button', {
          name: 'governance_attestation_check_result',
        }),
      );

      expect(
        screen.getByText('governance_attestation_no_chain_panel'),
      ).toBeVisible();

      // The digest is checkable with no chain involved at all.
      await waitFor(() =>
        expect(screen.getByText('ac18113834…4a4f00f8')).toBeVisible(),
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('the verify panel', () => {
    const openPanel = () =>
      fireEvent.click(
        screen.getByRole('button', {
          name: 'governance_attestation_check_result',
        }),
      );

    it('shows both columns with a match per row', async () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_column_chain'),
        ).toBeVisible(),
      );
      expect(
        screen.getByText('governance_attestation_column_page'),
      ).toBeVisible();

      // Outcome, the three tallies, and the digest - each its own row.
      const outcomeRow = screen.getByTestId(
        'attestation-row-governance_attestation_row_outcome',
      );
      expect(outcomeRow).toHaveTextContent('governance_attestation_outcome_passed');
      expect(outcomeRow).toHaveTextContent('matches');

      expect(
        screen.getByTestId('attestation-row-governance_yes'),
      ).toHaveTextContent('330.25');
      expect(
        screen.getByTestId('attestation-row-governance_no'),
      ).toHaveTextContent('504.123456');
      expect(
        screen.getByTestId('attestation-row-governance_abstain'),
      ).toHaveTextContent('0.5');
    });

    it("says the result hasn't changed once every row matches", async () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      // The digest here is recomputed in the browser from the vote signatures
      // and compared with the one the calldata carries - not read off either.
      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_unchanged'),
        ).toBeVisible(),
      );
      expect(
        screen.getByTestId('attestation-row-governance_attestation_row_digest'),
      ).toHaveTextContent('ac18113834…4a4f00f8');
    });

    it('reports a difference rather than a match when the chain disagrees', async () => {
      // A real attestation, but for a different tally and a different digest.
      mockRpc(MAINNET_ATTESTATION_CALLDATA);

      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(screen.getByText('governance_attestation_differs')).toBeVisible(),
      );
      expect(
        screen.getByTestId('attestation-row-governance_yes'),
      ).toHaveTextContent('does not match');
    });

    it('never claims the blockchain validated the votes', async () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_scope_note'),
        ).toBeVisible(),
      );
    });

    it('fails only the digest row when a weight has been tampered with', async () => {
      const tampered = proofs.map((proof, index) =>
        index === 1 ? { ...proof, weight: proof.weight + 100 } : proof,
      );

      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain(), proofs: tampered })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(
          screen.getByTestId(
            'attestation-row-governance_attestation_row_digest',
          ),
        ).toHaveTextContent('does not match'),
      );

      // The tally rows come straight off the calldata and are untouched by it.
      expect(
        screen.getByTestId('attestation-row-governance_yes'),
      ).toHaveTextContent('matches');
      expect(
        screen.getByTestId('attestation-row-governance_no'),
      ).toHaveTextContent('matches');
      expect(
        screen.getByTestId(
          'attestation-row-governance_attestation_row_outcome',
        ),
      ).toHaveTextContent('matches');
    });

    it('refuses a transaction that carries some other proposal', async () => {
      render(
        <ProposalAttestation
          proposal={{ ...proposal, _id: '6a78c77a0dab8e84237a9180' }}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_unrelated'),
        ).toBeVisible(),
      );
    });

    it('offers a retry when the node cannot be reached', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
        />,
      );

      openPanel();

      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_rpc_error offline'),
        ).toBeVisible(),
      );
      expect(
        screen.getByRole('button', {
          name: 'governance_attestation_try_again',
        }),
      ).toBeVisible();
    });
  });

  describe("the citizen's own vote", () => {
    it('shows their leaf, weight, index and signature above the comparison', async () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
          userId="65f1a2b3c4d5e6f701234568"
        />,
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: 'governance_attestation_check_result',
        }),
      );

      expect(
        screen.getByText('governance_attestation_your_vote_title'),
      ).toBeVisible();
      expect(screen.getByText('governance_no')).toBeVisible();
      expect(screen.getByText(/504\.123456/)).toBeVisible();
      expect(
        screen.getByText('governance_attestation_entry_index 2'),
      ).toBeVisible();
      expect(screen.getByText('0xcc33dd44ee55…9900112233')).toBeVisible();

      // The panel's own reads settle after this, and are checked elsewhere.
      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_unchanged'),
        ).toBeVisible(),
      );
    });

    it('shows nothing extra for someone who did not vote', async () => {
      render(
        <ProposalAttestation
          proposal={proposal}
          lockState={lockState({ onChain: onChain() })}
          userId="someone-else"
        />,
      );

      fireEvent.click(
        screen.getByRole('button', {
          name: 'governance_attestation_check_result',
        }),
      );

      expect(
        screen.queryByText('governance_attestation_your_vote_title'),
      ).toBeNull();

      await waitFor(() =>
        expect(
          screen.getByText('governance_attestation_unchanged'),
        ).toBeVisible(),
      );
    });
  });
});
