import { useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import CopyableHash from './CopyableHash';

import { useProposalAttestation } from '../../hooks/useProposalAttestation';
import { Proposal, ProposalLockState } from '../../types';
import {
  DecodedProposalResult,
  OwnVoteProof,
  findOwnVoteProofs,
  getChainName,
  getExplorerTxUrl,
  truncateMiddle,
} from '../../utils/proposalAttestation';
import {
  ProofRecomputation,
  recomputeProofsHash,
} from '../../utils/proposalProofs';

/**
 * On-chain verification of a finalized proposal.
 *
 * What this proves, and all it proves: the result on this page is the one that
 * was frozen and published, unchanged since. It says nothing about whether the
 * votes themselves were valid - the weights came from our own chain reads at
 * voting time, and no blockchain checked them. Every string below is written to
 * stay inside that claim; the first citizen who catches an overclaim will trust
 * the badge less than if it had never been shown.
 *
 * And every unhappy state still says the result stands, because it does: the
 * outcome is decided and frozen before any transaction is broadcast. A badge
 * that only ever appears when things worked teaches people it means nothing.
 */

type Props = {
  proposal: Proposal;
  lockState: ProposalLockState;
  userId?: string;
};

const formatWeight = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
  }).format(Number(value) || 0);

const Row = ({
  label,
  page,
  chain,
  match,
}: {
  label: string;
  page: string;
  chain: string;
  match: boolean | null;
}) => (
  <div
    className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-gray-100 py-2 last:border-b-0 sm:grid-cols-[7rem_1fr_1fr_1.5rem] sm:items-center"
    data-testid={`attestation-row-${label}`}
  >
    <span className="text-xs font-medium uppercase tracking-wide text-gray-500 sm:normal-case sm:tracking-normal sm:text-sm sm:font-medium sm:text-gray-700">
      {label}
    </span>
    <span className="text-right text-sm text-gray-900 sm:text-left sm:font-mono sm:text-xs">
      {page}
    </span>
    <span className="col-start-1 text-xs text-gray-500 sm:col-start-auto sm:font-mono sm:text-xs sm:text-gray-900">
      {chain}
    </span>
    <span
      className={`text-right text-sm ${
        match === false ? 'text-red-600' : 'text-gray-900'
      }`}
      aria-hidden="true"
    >
      {match === null ? '–' : match ? '✓' : '✕'}
    </span>
    <span className="sr-only">
      {match === null ? 'not checked' : match ? 'matches' : 'does not match'}
    </span>
  </div>
);

const OwnVote = ({ proofs, t }: { proofs: OwnVoteProof[]; t: any }) => {
  if (proofs.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="mb-2 text-sm font-semibold text-gray-900">
        {t('governance_attestation_your_vote_title')}
      </p>
      {proofs.map((proof) => (
        <div key={proof.index} className="mb-2 space-y-1 last:mb-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-800">
            <span className="font-medium uppercase">
              {t(`governance_${proof.vote}`)}
            </span>
            <span className="text-gray-600">
              {formatWeight(proof.weight)}{' '}
              {t('governance_attestation_weight_unit')}
            </span>
            <span className="text-gray-500">
              {t('governance_attestation_entry_index', {
                index: proof.index + 1,
              })}
            </span>
          </div>
          {proof.signature && (
            <CopyableHash
              value={proof.signature}
              copyLabel={t('governance_attestation_copy_signature')}
              lead={14}
              tail={10}
              className="text-xs text-gray-500"
            />
          )}
        </div>
      ))}
    </div>
  );
};

const ProposalAttestation = ({ proposal, lockState, userId }: Props) => {
  const t = useTranslations();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [recomputation, setRecomputation] = useState<ProofRecomputation | null>(
    null,
  );

  const onChain = lockState.onChain || null;
  const status = onChain?.status;
  const explorerUrl = onChain ? getExplorerTxUrl(onChain) : null;
  const chainName = getChainName(onChain?.chainId);

  const attestation = useProposalAttestation(
    onChain,
    proposal._id,
    isPanelOpen && status === 'confirmed',
  );

  const ownProofs = useMemo(
    () => findOwnVoteProofs(lockState, proposal.votes, userId),
    [lockState, proposal.votes, userId],
  );

  // Folded only once the citizen asks for it - a few thousand leaves is real
  // work, and nobody who never opens the panel should pay for it.
  useEffect(() => {
    if (!isPanelOpen || recomputation) {
      return;
    }

    let cancelled = false;

    recomputeProofsHash(lockState, proposal.votes).then((result) => {
      if (!cancelled) {
        setRecomputation(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPanelOpen, recomputation, lockState, proposal.votes]);

  const decoded: DecodedProposalResult | null =
    attestation.state === 'ready' ? attestation.decoded : null;

  const localProofsHash = String(lockState.proofsHash || '').toLowerCase();
  const recomputedHash =
    recomputation?.state === 'computed' ? recomputation.proofsHash : null;

  // Deliberately compared at the same six decimals both sides were pinned to,
  // so a float that never round-tripped exactly does not read as tampering.
  const sameWeight = (a: number, b: number) =>
    (Number(a) || 0).toFixed(6) === (Number(b) || 0).toFixed(6);

  const outcomeLabel = (outcome: 'passed' | 'rejected') =>
    outcome === 'passed'
      ? t('governance_attestation_outcome_passed')
      : t('governance_attestation_outcome_rejected');

  const everythingMatches =
    decoded !== null &&
    decoded.outcome === lockState.outcome &&
    sameWeight(decoded.results.yes, lockState.results?.yes) &&
    sameWeight(decoded.results.no, lockState.results?.no) &&
    sameWeight(decoded.results.abstain, lockState.results?.abstain) &&
    recomputedHash !== null &&
    recomputedHash === decoded.proofsHash;

  const renderStatusLine = () => {
    if (!onChain) {
      return (
        <p className="text-sm text-gray-600">
          {t('governance_attestation_not_on_chain')}
        </p>
      );
    }

    if (status === 'reverted' || status === 'failed') {
      return (
        <p className="text-sm text-gray-600">
          {status === 'reverted'
            ? t('governance_attestation_reverted')
            : t('governance_attestation_failed')}
        </p>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-700">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            lockState.outcome === 'passed'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {outcomeLabel(lockState.outcome)}
        </span>
        <span className="text-gray-600">
          {status === 'pending'
            ? t('governance_attestation_pending_line', { chain: chainName })
            : t('governance_attestation_recorded_line', {
                chain: chainName,
                block: onChain.blockNumber
                  ? new Intl.NumberFormat('en-US').format(onChain.blockNumber)
                  : '—',
              })}
        </span>
        <CopyableHash
          value={onChain.txHash}
          copyLabel={t('governance_attestation_copy_tx')}
          className="text-xs text-gray-500"
        />
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-900 underline underline-offset-2 hover:text-black"
          >
            {t('governance_attestation_view_transaction')}
          </a>
        )}
      </div>
    );
  };

  const renderComparison = () => {
    if (attestation.state === 'loading') {
      return (
        <p className="text-sm text-gray-600">
          {t('governance_attestation_reading_chain')}
        </p>
      );
    }

    if (attestation.state === 'not-found') {
      return (
        <p className="text-sm text-gray-600">
          {t('governance_attestation_tx_not_found')}
        </p>
      );
    }

    if (attestation.state === 'unrelated') {
      return (
        <p className="text-sm text-gray-600">
          {t('governance_attestation_unrelated')}
        </p>
      );
    }

    if (attestation.state === 'error') {
      return (
        <div className="text-sm text-gray-600">
          <p>
            {t('governance_attestation_rpc_error', {
              message: attestation.message,
            })}
          </p>
          <button
            type="button"
            onClick={attestation.retry}
            className="mt-2 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-200"
          >
            {t('governance_attestation_try_again')}
          </button>
        </div>
      );
    }

    if (!decoded) {
      return null;
    }

    const digestPage =
      recomputation === null
        ? t('governance_attestation_recomputing')
        : recomputation.state === 'unavailable'
          ? t('governance_attestation_digest_unavailable')
          : truncateMiddle(recomputedHash || '', 10, 8);

    return (
      <div>
        <div className="hidden grid-cols-[7rem_1fr_1fr_1.5rem] gap-x-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
          <span />
          <span>{t('governance_attestation_column_page')}</span>
          <span>{t('governance_attestation_column_chain')}</span>
          <span />
        </div>

        <Row
          label={t('governance_attestation_row_outcome')}
          page={outcomeLabel(lockState.outcome)}
          chain={outcomeLabel(decoded.outcome)}
          match={lockState.outcome === decoded.outcome}
        />
        <Row
          label={t('governance_yes')}
          page={formatWeight(lockState.results?.yes)}
          chain={formatWeight(decoded.results.yes)}
          match={sameWeight(decoded.results.yes, lockState.results?.yes)}
        />
        <Row
          label={t('governance_no')}
          page={formatWeight(lockState.results?.no)}
          chain={formatWeight(decoded.results.no)}
          match={sameWeight(decoded.results.no, lockState.results?.no)}
        />
        <Row
          label={t('governance_abstain')}
          page={formatWeight(lockState.results?.abstain)}
          chain={formatWeight(decoded.results.abstain)}
          match={sameWeight(decoded.results.abstain, lockState.results?.abstain)}
        />
        <Row
          label={t('governance_attestation_row_digest')}
          page={digestPage}
          chain={truncateMiddle(decoded.proofsHash, 10, 8)}
          match={
            recomputedHash === null
              ? null
              : recomputedHash === decoded.proofsHash
          }
        />

        <p className="mt-3 text-sm text-gray-700">
          {everythingMatches
            ? t('governance_attestation_unchanged')
            : recomputation?.state === 'unavailable' ||
                recomputation === null ||
                attestation.state !== 'ready'
              ? t('governance_attestation_partial')
              : t('governance_attestation_differs')}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {t('governance_attestation_scope_note')}
        </p>
      </div>
    );
  };

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6"
      data-testid="proposal-attestation"
    >
      <h3 className="mb-4 text-lg font-semibold">
        {t('governance_verification')}
      </h3>

      {renderStatusLine()}

      <p className="mt-1 text-xs text-gray-500">
        {t('governance_attestation_result_stands')}
      </p>

      {status !== 'reverted' && status !== 'failed' && (
        <button
          type="button"
          onClick={() => setIsPanelOpen((open) => !open)}
          aria-expanded={isPanelOpen}
          className="mt-3 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200"
        >
          {isPanelOpen
            ? t('governance_attestation_hide_check')
            : t('governance_attestation_check_result')}
        </button>
      )}

      {isPanelOpen && (
        <div className="mt-3 rounded-lg border border-gray-200 p-3">
          <OwnVote proofs={ownProofs} t={t} />

          {status === 'confirmed' ? (
            renderComparison()
          ) : (
            <div className="text-sm text-gray-700">
              <p>
                {status === 'pending'
                  ? t('governance_attestation_pending_panel')
                  : t('governance_attestation_no_chain_panel')}
              </p>
              <div className="mt-3">
                <div className="hidden grid-cols-[7rem_1fr_1fr_1.5rem] gap-x-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                  <span />
                  <span>{t('governance_attestation_column_recomputed')}</span>
                  <span>{t('governance_attestation_column_record')}</span>
                  <span />
                </div>
                <Row
                  label={t('governance_attestation_row_digest')}
                  page={
                    recomputation === null
                      ? t('governance_attestation_recomputing')
                      : recomputation.state === 'unavailable'
                        ? t('governance_attestation_digest_unavailable')
                        : truncateMiddle(recomputedHash || '', 10, 8)
                  }
                  chain={truncateMiddle(localProofsHash, 10, 8)}
                  match={
                    recomputedHash === null
                      ? null
                      : recomputedHash === localProofsHash
                  }
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t('governance_attestation_offchain_digest_note')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProposalAttestation;
