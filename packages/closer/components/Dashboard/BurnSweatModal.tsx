import { useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import api from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import TokenUserSearchInput, { TokenUserResult } from './TokenUserSearchInput';

interface BurnEntry {
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

const BurnSweatModal = ({ onClose }: { onClose: () => void }) => {
  const t = useTranslations();
  const [user, setUser] = useState<TokenUserResult | null>(null);
  const [entries, setEntries] = useState<BurnEntry[]>([newEntry()]);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorExplorerUrl, setErrorExplorerUrl] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const idempotencyRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);

  const validEntries = entries.filter(
    (entry) =>
      entry.amount && Number(entry.amount) > 0 && entry.contributionDate,
  );
  const allEntriesComplete = validEntries.length === entries.length;

  const updateEntry = (id: string, patch: Partial<BurnEntry>) => {
    setEntries((previous) =>
      previous.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const submit = async () => {
    if (!user?.walletAddress || !confirmed || !allEntriesComplete) return;
    setIsSubmitting(true);
    setError('');
    setErrorExplorerUrl('');
    try {
      const submissionEntries = entries.map(({ amount, contributionDate }) => ({
        amount,
        contributionDate,
      }));
      const fingerprint = JSON.stringify({
        walletAddress: user.walletAddress,
        entries: submissionEntries,
      });
      if (idempotencyRef.current?.fingerprint !== fingerprint) {
        idempotencyRef.current = {
          fingerprint,
          requestId: createRequestId(),
        };
      }
      const response = await api.post('/sweat/burns', {
        requestId: idempotencyRef.current.requestId,
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
        walletAddress: user.walletAddress,
        entries: submissionEntries,
      });
      const result = response.data.results ?? response.data;
      setExplorerUrl(result.explorerUrl ?? 'submitted');
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
      <div className="flex flex-col max-h-[85vh]">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {t('token_sales_dashboard_burn_sweat_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('token_sales_dashboard_burn_sweat_description')}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('token_sales_dashboard_mint_sweat_user')}
          </label>
          <TokenUserSearchInput
            selectedUser={user}
            onSelect={setUser}
            onClear={() => setUser(null)}
            placeholder={t('token_sales_dashboard_mint_sweat_search_user')}
          />
          {user && !user.walletAddress && (
            <p className="text-xs text-red-500 mt-1">
              {t('token_sales_dashboard_mint_sweat_no_wallet_warning')}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-2 p-3 border border-border rounded-lg bg-muted/20 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
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
                  className="w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
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
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setEntries((previous) => [...previous, newEntry()])}
            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-accent hover:text-accent"
          >
            + {t('token_sales_dashboard_burn_add_entry')}
          </button>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>{t('token_sales_dashboard_burn_confirmation')}</span>
          </label>
          {!allEntriesComplete && (
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
          {explorerUrl && (
            <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
              <p>{t('token_sales_dashboard_sweat_transaction_submitted')}</p>
              {explorerUrl !== 'submitted' && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t('token_sales_dashboard_view_transaction')}
                </a>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="secondary" onClick={onClose}>
              {t('token_sales_dashboard_cancel')}
            </Button>
            <Button
              onClick={submit}
              isEnabled={
                Boolean(user?.walletAddress) &&
                allEntriesComplete &&
                confirmed &&
                !isSubmitting &&
                !explorerUrl
              }
              isLoading={isSubmitting}
            >
              {t('token_sales_dashboard_burn_sweat_submit')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BurnSweatModal;
