import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { parseTokenUnits } from '../../utils/currencyFormat';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';
import UserSearchInput, { UserSearchResult } from './UserSearchInput';

interface SweatEntry {
  id: string;
  user: UserSearchResult | null;
  amount: string;
}

interface MintSweatModalProps {
  onClose: () => void;
}

let entryIdCounter = 0;
const generateEntryId = () => `entry-${++entryIdCounter}`;

const MintSweatModal = ({ onClose }: MintSweatModalProps) => {
  const t = useTranslations();
  const [entries, setEntries] = useState<SweatEntry[]>([
    { id: generateEntryId(), user: null, amount: '' },
  ]);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: generateEntryId(), user: null, amount: '' },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((e) => e.id !== id);
    });
  };

  const updateEntryUser = (id: string, user: UserSearchResult | null) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, user } : e)),
    );
  };

  const updateEntryAmount = (id: string, amount: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, amount } : e)),
    );
  };

  const validEntries = entries.filter(
    (e) => e.user?.walletAddress && e.amount && Number(e.amount) > 0,
  );

  const totalAmount = entries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

  const entriesWithoutWallet = entries.filter(
    (e) => e.user && !e.user.walletAddress && e.amount && Number(e.amount) > 0,
  );

  const handleExport = () => {
    const { address: tokenAddress, decimals: tokenDecimals } =
      blockchainConfig.BLOCKCHAIN_DAO_TOKEN;
    const { symbol: tokenSymbol } = blockchainConfig.BLOCKCHAIN_DAO_TOKEN;
    const chainId = String(blockchainConfig.BLOCKCHAIN_NETWORK_ID);

    const transactions = validEntries.map((entry) => {
      const amountSmallestUnit = parseTokenUnits(entry.amount, tokenDecimals);
      return {
        to: tokenAddress,
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
          amount: amountSmallestUnit.toString(),
        },
      };
    });

    const batchJson = {
      version: '1.0',
      chainId,
      createdAt: Date.now(),
      meta: {
        name: `${tokenSymbol} Sweat Distribution`,
        description: `Transfer $${tokenSymbol} tokens from treasury to ${transactions.length} addresses - ${totalAmount} ${tokenSymbol} total`,
        txBuilderVersion: '1.16.5',
        createdFromSafeAddress: '',
        createdFromOwnerAddress: '',
      },
      transactions,
    };

    const blob = new Blob([JSON.stringify(batchJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sweat-distribution-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      closeModal={onClose}
      className="md:w-[700px] md:max-w-[90vw]"
    >
      <div className="flex flex-col max-h-[85vh]">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {t('token_sales_dashboard_mint_sweat_title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('token_sales_dashboard_mint_sweat_description')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-muted/20 sm:flex-row sm:items-start"
            >
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('token_sales_dashboard_mint_sweat_user')} #{index + 1}
                </label>
                <UserSearchInput
                  selectedUser={entry.user}
                  onSelect={(user) => updateEntryUser(entry.id, user)}
                  onClear={() => updateEntryUser(entry.id, null)}
                  placeholder={t(
                    'token_sales_dashboard_mint_sweat_search_user',
                  )}
                  showWallet
                />
                {entry.user && !entry.user.walletAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {t('token_sales_dashboard_mint_sweat_no_wallet_warning')}
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 sm:w-28 sm:flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('token_sales_dashboard_mint_sweat_amount')}
                  </label>
                  <Input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => updateEntryAmount(entry.id, e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.id)}
                  disabled={entries.length <= 1}
                  className="p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 space-y-3">
          <button
            type="button"
            onClick={addEntry}
            className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-muted-foreground hover:border-accent hover:text-accent transition-colors"
          >
            + {t('token_sales_dashboard_mint_sweat_add_entry')}
          </button>

          <div className="flex flex-col gap-3 text-sm border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">
                {t('token_sales_dashboard_mint_sweat_total')}: {totalAmount}{' '}
                {blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol}
              </span>
              <span className="text-muted-foreground">
                {validEntries.length}{' '}
                {t('token_sales_dashboard_mint_sweat_valid_entries')}
              </span>
              {entriesWithoutWallet.length > 0 && (
                <span className="text-red-500 text-xs">
                  {entriesWithoutWallet.length}{' '}
                  {t('token_sales_dashboard_mint_sweat_skipped_no_wallet')}
                </span>
              )}
            </div>
            <div className="flex gap-2 self-end">
              <Button variant="secondary" onClick={onClose}>
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={handleExport}
                isEnabled={validEntries.length > 0}
              >
                {t('token_sales_dashboard_mint_sweat_export')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default MintSweatModal;
