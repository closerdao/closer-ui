import { useRouter } from 'next/router';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { SafeProposalResult, TokenUserResult } from '../../types/onchainAdmin';
import api from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import {
  buildSweatBurnTransaction,
  contributionDateToDaysAgo,
  downloadTransactionBuilderJson,
} from '../../utils/safeTransactionBuilder';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import OnchainTransactionSummary from './OnchainTransactionSummary';
import TokenUserSearchInput from './TokenUserSearchInput';

export interface BurnEntry {
  id: string;
  amount: string;
  contributionDate: string;
}

let entryIdCounter = 0;
const today = () => new Date().toISOString().slice(0, 10);
const newEntry = (): BurnEntry => ({
  id: `sweat-burn-${++entryIdCounter}`,
  amount: '',
  contributionDate: today(),
});
const createRequestId = () =>
  window.crypto?.randomUUID?.() ??
  `sweat-burn-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isCompleteEntry = (entry: BurnEntry) =>
  Boolean(entry.amount) &&
  Number(entry.amount) > 0 &&
  contributionDateToDaysAgo(entry.contributionDate) != null;

export const buildBurnSweatSubmissionEntries = (entries: BurnEntry[]) =>
  entries.filter(isCompleteEntry).map(({ amount, contributionDate }) => ({
    amount,
    contributionDate,
  }));

const BurnSweatModal = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations();
  const { locale } = useRouter();
  const [user, setUser] = useState<TokenUserResult | null>(null);
  const [entries, setEntries] = useState<BurnEntry[]>([newEntry()]);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorExplorerUrl, setErrorExplorerUrl] = useState('');
  const [result, setResult] = useState<SafeProposalResult | null>(null);
  const idempotencyRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);

  const allEntriesComplete = entries.every(isCompleteEntry);
  const canBuildTransaction = Boolean(user?.hasWallet) && allEntriesComplete;
  const completeEntries = entries.filter(isCompleteEntry);
  const totalAmount = completeEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const formattedTotal = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 18,
  }).format(totalAmount);

  const updateEntry = (id: string, patch: Partial<BurnEntry>) => {
    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const exportJson = () => {
    if (!user?.hasWallet || !allEntriesComplete) return;
    downloadTransactionBuilderJson({
      name: 'SWEAT burn',
      description: `Burn SWEAT for ${user.screenname}`,
      filename: `sweat-burn-${today()}.json`,
      transactions: [
        buildSweatBurnTransaction(
          user.walletAddress,
          buildBurnSweatSubmissionEntries(entries),
        ),
      ],
    });
  };

  const submit = async () => {
    if (!user?.hasWallet || !confirmed || !allEntriesComplete || result) return;
    setIsSubmitting(true);
    setError('');
    setErrorExplorerUrl('');
    try {
      const submissionEntries = buildBurnSweatSubmissionEntries(entries);
      const fingerprint = JSON.stringify({
        userId: user._id,
        entries: submissionEntries,
      });
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = {
          fingerprint,
          requestId: createRequestId(),
        };
      }
      const response = await api.post('/safe/proposals', {
        requestId: idempotencyRef.current.requestId,
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
        operation: 'sweatBurn',
        userId: user._id,
        entries: submissionEntries,
      });
      setResult(response.data.results ?? response.data);
    } catch (submissionError) {
      const details = getApiErrorDetails(
        submissionError,
        t('token_sales_dashboard_onchain_error'),
      );
      setError(details.message);
      setErrorExplorerUrl(details.explorerUrl ?? '');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal closeModal={onClose} className="md:w-[680px] md:max-w-[90vw]">
      <div className="flex max-h-[85vh] flex-col">
        <div className="mb-4">
          <h2 className="text-lg font-semibold md:text-xl">
            {t('token_sales_dashboard_burn_sweat_title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('token_sales_dashboard_burn_sweat_description')}
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('token_sales_dashboard_mint_sweat_user')}
          </label>
          <TokenUserSearchInput
            selectedUser={user}
            onSelect={(selectedUser) => {
              setUser(selectedUser);
              setConfirmed(false);
            }}
            onClear={() => {
              setUser(null);
              setConfirmed(false);
            }}
            placeholder={t('token_sales_dashboard_mint_sweat_search_user')}
          />
          {user && !user.hasWallet && (
            <p className="mt-1 text-xs text-red-500">
              {t('token_sales_dashboard_burn_no_wallet_blocked')}
            </p>
          )}
        </div>

        {(!user || user.hasWallet) && (
          <>
            <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
              {entries.map((entry) => (
                <fieldset
                  key={entry.id}
                  disabled={Boolean(result)}
                  className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end disabled:opacity-70"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('token_sales_dashboard_mint_sweat_amount')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={entry.amount}
                      onChange={(event) =>
                        updateEntry(entry.id, { amount: event.target.value })
                      }
                      className="w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('token_sales_dashboard_contribution_date')}
                    </label>
                    <Input
                      type="date"
                      max={today()}
                      value={entry.contributionDate}
                      onChange={(event) =>
                        updateEntry(entry.id, {
                          contributionDate: event.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEntries((previous) =>
                        previous.length > 1
                          ? previous.filter((item) => item.id !== entry.id)
                          : previous,
                      )
                    }
                    disabled={entries.length <= 1}
                    className="p-2 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                    aria-label={t('generic_remove')}
                  >
                    ✕
                  </button>
                </fieldset>
              ))}
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setEntries((previous) => [...previous, newEntry()])
                }
                disabled={Boolean(result)}
                className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent disabled:opacity-50"
              >
                + {t('token_sales_dashboard_burn_add_entry')}
              </button>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={Boolean(result)}
                  className="mt-1"
                />
                <span>{t('token_sales_dashboard_burn_confirmation')}</span>
              </label>
              {!allEntriesComplete && (
                <p className="text-sm text-amber-700">
                  {t('token_sales_dashboard_complete_all_rows')}
                </p>
              )}
            </div>
          </>
        )}

        <div className="space-y-3">
          {error && (
            <div className="text-sm text-red-500">
              <p>{error}</p>
              {errorExplorerUrl && (
                <a
                  href={errorExplorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t('token_sales_dashboard_check_proposer_transactions')}
                </a>
              )}
            </div>
          )}
          {result && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
              <p>{t('token_sales_dashboard_safe_proposal_created')}</p>
              {result.safeUrl && (
                <a
                  href={result.safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t('token_sales_dashboard_open_safe')}
                </a>
              )}
            </div>
          )}
          <div className="space-y-3 border-t border-border pt-3">
            <OnchainTransactionSummary
              title={t('token_sales_dashboard_transaction_summary')}
              items={[
                {
                  label: t('token_sales_dashboard_sweat_to_burn'),
                  value: `${formattedTotal} ${blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.symbol}`,
                },
                {
                  label: t(
                    'token_sales_dashboard_contribution_entries_included',
                  ),
                  value: String(completeEntries.length),
                },
              ]}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={exportJson}
                isEnabled={canBuildTransaction && !result}
              >
                {t('token_sales_dashboard_mint_sweat_export')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={submit}
                isEnabled={
                  canBuildTransaction && confirmed && !isSubmitting && !result
                }
                isLoading={isSubmitting}
              >
                {t('token_sales_dashboard_burn_sweat_submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BurnSweatModal;
