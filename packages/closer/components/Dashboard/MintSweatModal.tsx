import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import api, { formatSearch } from '../../utils/api';
import { parseTokenUnits } from '../../utils/currencyFormat';
import Modal from '../Modal';
import { Input } from '../ui/';
import Button from '../ui/Button';

interface UserResult {
  _id: string;
  screenname: string;
  walletAddress?: string;
  email?: string;
}

interface SweatEntry {
  id: string;
  user: UserResult | null;
  amount: string;
}

interface MintSweatModalProps {
  onClose: () => void;
}

const UserSearchInput = ({
  selectedUser,
  onSelect,
  onClear,
  placeholder,
}: {
  selectedUser: UserResult | null;
  onSelect: (user: UserResult) => void;
  onClear: () => void;
  placeholder: string;
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const params = {
        where: formatSearch({ _search: query }),
        sort_by: '-created',
        limit: 10,
      };
      const { data } = await api.get('/user', { params });
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(value), 300);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
        <span className="text-sm font-medium truncate">
          {selectedUser.screenname}
        </span>
        {selectedUser.walletAddress && (
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
            {selectedUser.walletAddress.slice(0, 6)}...
            {selectedUser.walletAddress.slice(-4)}
          </span>
        )}
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-muted-foreground hover:text-foreground text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        onFocus={() => search.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
      />
      {isOpen && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {!isLoading && results.length === 0 && search.length >= 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          )}
          {results.map((user) => (
            <button
              key={user._id}
              type="button"
              onClick={() => {
                onSelect(user);
                setSearch('');
                setIsOpen(false);
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-muted/50 flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium">{user.screenname}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {user.walletAddress
                  ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                  : 'No wallet'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

  const updateEntryUser = (id: string, user: UserResult | null) => {
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
          <h2 className="text-xl font-semibold">
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
              className="flex items-start gap-2 p-3 border border-border rounded-lg bg-muted/20"
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
                />
                {entry.user && !entry.user.walletAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {t('token_sales_dashboard_mint_sweat_no_wallet_warning')}
                  </p>
                )}
              </div>
              <div className="w-28 flex-shrink-0">
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
                className="mt-5 p-1.5 text-muted-foreground hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✕
              </button>
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

          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
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
            <div className="flex gap-2">
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
