import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import api from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import { parseTokenUnits } from '../../utils/currencyFormat';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import TokenUserSearchInput, { TokenUserResult } from './TokenUserSearchInput';

export interface TransferEntry {
  id: string;
  user: TokenUserResult | null;
  amount: string;
  mintSweat: boolean;
  contributionDate: string;
}

interface SafeProposalResult {
  safeTxHash?: string;
  safeUrl?: string;
}

type TransactionBuilderTransaction = {
  to: string;
  value: string;
  data: null;
  contractMethod: {
    inputs: Array<{
      internalType: string;
      name: string;
      type: string;
    }>;
    name: string;
    payable: boolean;
  };
  contractInputsValues: Record<string, string>;
};

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
const contributionDateToDaysAgo = (contributionDate: string) => {
  const contributionDay = Date.parse(`${contributionDate}T00:00:00.000Z`);
  const now = new Date();
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.floor((todayUtc - contributionDay) / (24 * 60 * 60 * 1000));
};

export const buildTransferSubmissionEntries = (entries: TransferEntry[]) => {
  const isComplete = entries.every(
    (entry) =>
      Boolean(entry.user?.walletAddress) &&
      Boolean(entry.amount) &&
      Number(entry.amount) > 0 &&
      (!entry.mintSweat || Boolean(entry.contributionDate)),
  );
  if (!isComplete) {
    return { transferEntries: [], sweatEntries: [], isComplete: false };
  }
  return {
    transferEntries: entries.map((entry) => ({
      walletAddress: entry.user!.walletAddress!,
      amount: entry.amount,
    })),
    sweatEntries: entries
      .filter((entry) => entry.mintSweat)
      .map((entry) => ({
        walletAddress: entry.user!.walletAddress!,
        amount: entry.amount,
        contributionDate: entry.contributionDate,
      })),
    isComplete: true,
  };
};

const TransferTdfModal = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations();
  const [entries, setEntries] = useState<TransferEntry[]>([newEntry()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [safeResult, setSafeResult] = useState<SafeProposalResult | null>(null);
  const safeIdempotencyRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);

  const validEntries = entries.filter(
    (entry) =>
      entry.user?.walletAddress && entry.amount && Number(entry.amount) > 0,
  );
  const allEntriesComplete = entries.every(
    (entry) =>
      Boolean(entry.user?.walletAddress) &&
      Boolean(entry.amount) &&
      Number(entry.amount) > 0 &&
      (!entry.mintSweat || Boolean(entry.contributionDate)),
  );
  const totalAmount = entries.reduce(
    (sum, entry) => sum + (Number(entry.amount) || 0),
    0,
  );
  const sweatEntries = validEntries.filter((entry) => entry.mintSweat);
  const totalSweatAmount = sweatEntries.reduce(
    (sum, entry) => sum + (Number(entry.amount) || 0),
    0,
  );
  const submissionComplete = Boolean(safeResult);

  const updateEntry = (id: string, patch: Partial<TransferEntry>) => {
    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const exportJson = () => {
    if (!allEntriesComplete) return;

    const token = blockchainConfig.BLOCKCHAIN_DAO_TOKEN;
    const transactions: TransactionBuilderTransaction[] = validEntries.map(
      (entry) => ({
        to: token.address,
        value: '0',
        data: null,
        contractMethod: {
          inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'transfer',
          payable: false,
        },
        contractInputsValues: {
          to: entry.user!.walletAddress!,
          amount: parseTokenUnits(entry.amount, token.decimals).toString(),
        },
      }),
    );
    const sweatToken = blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN;
    sweatEntries.forEach((entry) => {
      transactions.push({
        to: sweatToken.address,
        value: '0',
        data: null,
        contractMethod: {
          inputs: [
            { internalType: 'address', name: 'account', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'uint256', name: 'daysAgo', type: 'uint256' },
          ],
          name: 'mint',
          payable: false,
        },
        contractInputsValues: {
          account: entry.user!.walletAddress!,
          amount: parseTokenUnits(entry.amount, sweatToken.decimals).toString(),
          daysAgo: String(contributionDateToDaysAgo(entry.contributionDate)),
        },
      });
    });
    const payload = {
      version: '1.0',
      chainId: String(blockchainConfig.BLOCKCHAIN_NETWORK_ID),
      createdAt: Date.now(),
      meta: {
        name: `${token.symbol} Treasury Transfer`,
        description: `Transfer ${totalAmount} ${token.symbol}${
          sweatEntries.length > 0 ? ` and mint ${totalSweatAmount} SWEAT` : ''
        }`,
        txBuilderVersion: '1.16.5',
        createdFromSafeAddress: '',
        createdFromOwnerAddress: '',
      },
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tdf-transfers-${todayForFile()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    if (!allEntriesComplete) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { transferEntries, sweatEntries: sweatSubmissionEntries } =
        buildTransferSubmissionEntries(entries);

      if (!safeResult) {
        const safeFingerprint = JSON.stringify({
          transferEntries,
          sweatEntries: sweatSubmissionEntries,
        });
        if (safeIdempotencyRef.current?.fingerprint !== safeFingerprint) {
          safeIdempotencyRef.current = {
            fingerprint: safeFingerprint,
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
      }
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
      <div className="flex flex-col max-h-[85vh]">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {t('token_sales_dashboard_transfer_tdf_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('token_sales_dashboard_transfer_tdf_description')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {entries.map((entry, index) => (
            <fieldset
              key={entry.id}
              disabled={Boolean(safeResult)}
              className="grid gap-2 p-3 border border-border rounded-lg bg-muted/20 sm:grid-cols-[minmax(0,1fr)_8rem_7rem_10rem_auto] sm:items-end disabled:opacity-70"
            >
              <div className="min-w-0">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
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
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
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
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
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
            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            + {t('token_sales_dashboard_mint_sweat_add_entry')}
          </button>
          {!allEntriesComplete && (
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
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col text-sm text-muted-foreground">
              <span>
                {totalAmount} {blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}
              </span>
              {sweatEntries.length > 0 && (
                <span>
                  {totalSweatAmount}{' '}
                  {blockchainConfig.BLOCKCHAIN_SWEAT_TOKEN.symbol}{' '}
                  {t('token_sales_dashboard_transfer_tdf_to_mint')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={exportJson}
                isEnabled={allEntriesComplete}
              >
                {t('token_sales_dashboard_export_json')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={submit}
                isEnabled={
                  allEntriesComplete && !isSubmitting && !submissionComplete
                }
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

const todayForFile = today;

export default TransferTdfModal;
