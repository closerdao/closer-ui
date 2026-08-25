import { useRouter } from 'next/router';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { SafeProposalResult, TokenUserResult } from '../../types/onchainAdmin';
import api from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import {
  buildSweatMintTransaction,
  contributionDateToDaysAgo,
  downloadTransactionBuilderJson,
} from '../../utils/safeTransactionBuilder';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import OnchainTransactionSummary from './OnchainTransactionSummary';
import TokenUserSearchInput from './TokenUserSearchInput';

export interface SweatEntry {
  id: string;
  user: TokenUserResult | null;
  amount: string;
  contributionDate: string;
}

let entryIdCounter = 0;
const generateEntryId = () => `sweat-entry-${++entryIdCounter}`;
const today = () => new Date().toISOString().slice(0, 10);
const newEntry = (): SweatEntry => ({
  id: generateEntryId(),
  user: null,
  amount: '',
  contributionDate: today(),
});
const createRequestId = () =>
  window.crypto?.randomUUID?.() ??
  `sweat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isCompleteWalletEntry = (entry: SweatEntry) =>
  Boolean(entry.user?.hasWallet) &&
  Boolean(entry.amount) &&
  Number(entry.amount) > 0 &&
  contributionDateToDaysAgo(entry.contributionDate) != null;

export const buildMintSweatSubmissionEntries = (entries: SweatEntry[]) =>
  entries.filter(isCompleteWalletEntry).map((entry) => ({
    userId: entry.user!._id,
    amount: entry.amount,
    contributionDate: entry.contributionDate,
  }));

const MintSweatModal = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations();
  const { locale } = useRouter();
  const [entries, setEntries] = useState<SweatEntry[]>([newEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorExplorerUrl, setErrorExplorerUrl] = useState('');
  const [result, setResult] = useState<SafeProposalResult | null>(null);
  const idempotencyRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);

  const validEntries = entries.filter(isCompleteWalletEntry);
  const walletlessEntries = entries.filter(
    (entry) => entry.user && !entry.user.hasWallet,
  );
  const hasIncompleteActionableEntry = entries.some(
    (entry) =>
      !entry.user || (entry.user.hasWallet && !isCompleteWalletEntry(entry)),
  );
  const canSubmit =
    validEntries.length > 0 && !hasIncompleteActionableEntry && !result;
  const totalAmount = validEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const formattedTotal = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 18,
  }).format(totalAmount);

  const updateEntry = (id: string, patch: Partial<SweatEntry>) => {
    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const exportJson = () => {
    if (!canSubmit) return;
    downloadTransactionBuilderJson({
      name: 'SWEAT mint',
      description: `Mint ${formattedTotal} SWEAT to ${validEntries.length} recipients`,
      filename: `sweat-mint-${today()}.json`,
      transactions: [
        buildSweatMintTransaction(
          validEntries.map((entry) => ({
            walletAddress: entry.user!.walletAddress!,
            amount: entry.amount,
            contributionDate: entry.contributionDate,
          })),
        ),
      ],
    });
  };

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError('');
    setErrorExplorerUrl('');
    try {
      const submissionEntries = buildMintSweatSubmissionEntries(entries);
      const fingerprint = JSON.stringify(submissionEntries);
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = {
          fingerprint,
          requestId: createRequestId(),
        };
      }
      const response = await api.post('/safe/proposals', {
        requestId: idempotencyRef.current.requestId,
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
        operation: 'sweatMint',
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
    <Modal closeModal={onClose} className="md:w-[780px] md:max-w-[90vw]">
      <div className="flex max-h-[85vh] flex-col">
        <div className="mb-4 flex-shrink-0">
          <h2 className="text-lg font-semibold md:text-xl">
            {t('token_sales_dashboard_mint_sweat_title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('token_sales_dashboard_mint_sweat_description')}
          </p>
        </div>

        <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
          {entries.map((entry, index) => (
            <fieldset
              key={entry.id}
              disabled={Boolean(result)}
              className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_auto] sm:items-end disabled:opacity-70"
            >
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('token_sales_dashboard_mint_sweat_user')} #{index + 1}
                </label>
                <TokenUserSearchInput
                  selectedUser={entry.user}
                  onSelect={(user) => updateEntry(entry.id, { user })}
                  onClear={() => updateEntry(entry.id, { user: null })}
                  placeholder={t(
                    'token_sales_dashboard_mint_sweat_search_user',
                  )}
                />
              </div>
              {entry.user && !entry.user.hasWallet ? (
                <p className="text-sm text-amber-700 sm:col-span-2">
                  {t('token_sales_dashboard_mint_sweat_no_wallet_warning')}
                </p>
              ) : (
                <>
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
                      placeholder="0"
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
                </>
              )}
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
                className="p-2 text-muted-foreground hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label={t('generic_remove')}
              >
                ✕
              </button>
            </fieldset>
          ))}
        </div>

        <div className="flex-shrink-0 space-y-3">
          <button
            type="button"
            onClick={() => setEntries((previous) => [...previous, newEntry()])}
            disabled={Boolean(result)}
            className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            + {t('token_sales_dashboard_mint_sweat_add_entry')}
          </button>
          {hasIncompleteActionableEntry && (
            <p className="text-sm text-amber-700">
              {t('token_sales_dashboard_complete_all_rows')}
            </p>
          )}
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
              {result.skipped?.length > 0 && (
                <p>
                  {t('token_sales_dashboard_proposal_skipped_count', {
                    count: result.skipped.length,
                  })}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-3">
            <OnchainTransactionSummary
              title={t('token_sales_dashboard_transaction_summary')}
              items={[
                {
                  label: t('token_sales_dashboard_sweat_to_mint'),
                  value: `${formattedTotal} ${blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.symbol}`,
                },
                {
                  label: t('token_sales_dashboard_recipients_included'),
                  value: String(validEntries.length),
                },
              ]}
              warning={
                walletlessEntries.length > 0
                  ? t('token_sales_dashboard_walletless_excluded_count', {
                      count: walletlessEntries.length,
                    })
                  : undefined
              }
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={exportJson}
                isEnabled={canSubmit}
              >
                {t('token_sales_dashboard_mint_sweat_export')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={submit}
                isEnabled={canSubmit && !isSubmitting}
                isLoading={isSubmitting}
              >
                {t('token_sales_dashboard_mint_sweat_submit')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MintSweatModal;
