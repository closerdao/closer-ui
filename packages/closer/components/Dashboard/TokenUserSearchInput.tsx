import { useCallback, useEffect, useRef, useState } from 'react';

import api, { formatSearch } from '../../utils/api';

export interface TokenUserResult {
  _id: string;
  screenname: string;
  walletAddress?: string;
  email?: string;
}

const TokenUserSearchInput = ({
  selectedUser,
  onSelect,
  onClear,
  placeholder,
  requiresWallet = true,
}: {
  selectedUser: TokenUserResult | null;
  onSelect: (user: TokenUserResult) => void;
  onClear: () => void;
  placeholder: string;
  requiresWallet?: boolean;
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TokenUserResult[]>([]);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

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
        onChange={(event) => {
          const value = event.target.value;
          setSearch(value);
          setIsOpen(true);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchUsers(value), 300);
        }}
        onFocus={() => search.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
      />
      {isOpen && search.length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Loading...
            </div>
          )}
          {!isLoading && results.length === 0 && (
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
              {(user.walletAddress || requiresWallet) && (
                <span className="text-xs text-muted-foreground font-mono">
                  {user.walletAddress
                    ? `${user.walletAddress.slice(
                        0,
                        6,
                      )}...${user.walletAddress.slice(-4)}`
                    : 'No wallet'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenUserSearchInput;
