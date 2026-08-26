import { useRouter } from 'next/router';

import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { SafeProposalResult, TokenUserResult } from '../../types/onchainAdmin';
import api from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import {
  buildSweatMintTransaction,
  buildTdfTransaction,
  contributionDateToDaysAgo,
  downloadTransactionBuilderJson,
} from '../../utils/safeTransactionBuilder';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import OnchainTransactionSummary from './OnchainTransactionSummary';
import TokenUserSearchInput from './TokenUserSearchInput';

export interface TransferEntry {
  id: string;
  user: TokenUserResult | null;
  amount: string;
  mintSweat: boolean;
  contributionDate: string;
}

let entryIdCounter = 0;
const today = () => new Date().toISOString().slice(0, 10);
const newEntry = (): TransferEntry => ({
  id: `tdf-transfer-${++entryIdCounter}`,
  user: null,
  amount: '',
  mintSweat: false,
  contributionDate: today(),
});
const createSafeRequestId = () =>
  window.crypto?.randomUUID?.() ??
  `tdf-transfer-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isCompleteWalletEntry = (entry: TransferEntry) =>
  Boolean(entry.user?.hasWallet) &&
  Boolean(entry.amount) &&
  Number(entry.amount) > 0 &&
  (!entry.mintSweat ||
    contributionDateToDaysAgo(entry.contributionDate) != null);

export const buildTransferSubmissionEntries = (entries: TransferEntry[]) => {
  const validEntries = entries.filter(isCompleteWalletEntry);
  const isComplete =
    validEntries.length > 0 &&
    !entries.some(
      (entry) =>
        !entry.user || (entry.user.hasWallet && !isCompleteWalletEntry(entry)),
    );
  if (!isComplete) {
    return { transferEntries: [], sweatEntries: [], isComplete: false };
  }
  return {
    transferEntries: validEntries.map((entry) => ({
      userId: entry.user!._id,
      amount: entry.amount,
    })),
    sweatEntries: validEntries
      .filter((entry) => entry.mintSweat)
      .map((entry) => ({
        userId: entry.user!._id,
        amount: entry.amount,
        contributionDate: entry.contributionDate,
      })),
    isComplete: true,
  };
};

const TransferTdfModal = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations();
  const { locale } = useRouter();
  const [entries, setEntries] = useState<TransferEntry[]>([newEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [safeResult, setSafeResult] = useState<SafeProposalResult | null>(null);
  const safeIdempotencyRef = useRef<{
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
  const allEntriesComplete =
    validEntries.length > 0 && !hasIncompleteActionableEntry;
  const totalAmount = validEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const sweatEntries = validEntries.filter((entry) => entry.mintSweat);
  const totalSweatAmount = sweatEntries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );
  const numberFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 18,
  });

  const updateEntry = (id: string, patch: Partial<TransferEntry>) => {
    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const exportJson = () => {
    if (!allEntriesComplete || safeResult) return;
    const transactions = validEntries.map((entry) =>
      buildTdfTransaction('transfer', entry.user!.walletAddress!, entry.amount),
    );
    if (sweatEntries.length > 0) {
      transactions.push(
        buildSweatMintTransaction(
          sweatEntries.map((entry) => ({
            walletAddress: entry.user!.walletAddress!,
            amount: entry.amount,
            contributionDate: entry.contributionDate,
          })),
        ),
      );
    }
    downloadTransactionBuilderJson({
      name: `${blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol} treasury transfer`,
      description: `Transfer ${numberFormatter.format(totalAmount)} ${
        blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol
      }${
        sweatEntries.length
          ? ` and mint ${numberFormatter.format(totalSweatAmount)} SWEAT`
          : ''
      }`,
      filename: `tdf-transfers-${today()}.json`,
      transactions,
    });
  };

  const submit = async () => {
    if (!allEntriesComplete || safeResult) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { transferEntries, sweatEntries: sweatSubmissionEntries } =
        buildTransferSubmissionEntries(entries);
      const fingerprint = JSON.stringify({
        transferEntries,
        sweatEntries: sweatSubmissionEntries,
      });
      if (safeIdempotencyRef.current?.fingerprint !== fingerprint) {
        safeIdempotencyRef.current = {
          fingerprint,
          requestId: createSafeRequestId(),
        };
      }
      const response = await api.post('/safe/proposals', {
        requestId: safeIdempotencyRef.current.requestId,
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
        operation: 'tdfTransfer',
        entries: transferEntries,
        sweatEntries: sweatSubmissionEntries,
      });
      setSafeResult(response.data.results ?? response.data);
    } catch (submissionError) {
      setError(
        getApiErrorDetails(
          submissionError,
          t('token_sales_dashboard_onchain_error'),
        ).message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal closeModal={onClose} className="md:w-[960px] md:max-w-[95vw]">
      <div className="flex max-h-[85vh] flex-col">
        <div className="mb-4">
          <h2 className="text-lg font-semibold md:text-xl">
            {t('token_sales_dashboard_transfer_tdf_title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('token_sales_dashboard_transfer_tdf_description')}
          </p>
        </div>

        <div className="mb-4 flex-1 space-y-3 overflow-y-auto">
          {entries.map((entry, index) => (
            <fieldset
              key={entry.id}
              disabled={Boolean(safeResult)}
              className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_10rem_auto] sm:items-end disabled:opacity-70"
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
                <p className="text-sm text-amber-700 sm:col-span-3">
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
                  <label className="flex min-h-[42px] items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={entry.mintSweat}
                      onChange={(event) =>
                        updateEntry(entry.id, {
                          mintSweat: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-accent"
                    />
                    {t('token_sales_dashboard_transfer_tdf_mint_sweat')}
                  </label>
                  <div>
                    {entry.mintSweat && (
                      <>
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
                      </>
                    )}
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
            onClick={() => setEntries((previous) => [...previous, newEntry()])}
            disabled={Boolean(safeResult)}
            className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            + {t('token_sales_dashboard_mint_sweat_add_entry')}
          </button>
          {hasIncompleteActionableEntry && (
            <p className="text-sm text-amber-700">
              {t('token_sales_dashboard_complete_all_rows')}
            </p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {safeResult && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
              <p>{t('token_sales_dashboard_safe_proposal_created')}</p>
              {safeResult.safeUrl && (
                <a
                  href={safeResult.safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t('token_sales_dashboard_open_safe')}
                </a>
              )}
              {safeResult.skipped?.length > 0 && (
                <p>
                  {t('token_sales_dashboard_proposal_skipped_count', {
                    count: safeResult.skipped.length,
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
                  label: t('token_sales_dashboard_tdf_to_transfer'),
                  value: `${numberFormatter.format(totalAmount)} ${
                    blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol
                  }`,
                },
                ...(sweatEntries.length > 0
                  ? [
                      {
                        label: t('token_sales_dashboard_sweat_to_mint'),
                        value: `${numberFormatter.format(totalSweatAmount)} ${
                          blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.symbol
                        }`,
                      },
                    ]
                  : []),
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
                isEnabled={allEntriesComplete && !safeResult}
              >
                {t('token_sales_dashboard_export_json')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={submit}
                isEnabled={allEntriesComplete && !isSubmitting && !safeResult}
                isLoading={isSubmitting}
              >
                {sweatEntries.length > 0
                  ? t('token_sales_dashboard_transfer_tdf_submit_with_sweat')
                  : t('token_sales_dashboard_propose_safe')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TransferTdfModal;
