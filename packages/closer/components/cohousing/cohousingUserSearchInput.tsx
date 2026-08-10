import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { SearchUserHit } from '../../utils/searchUser';
import { fetchUsersBySearchQuery } from '../../utils/searchUser';

export const CohousingUserSearchInput = ({
  selectedUser,
  onSelect,
  onClear,
  placeholder,
  loadingLabel,
  emptyLabel,
  noContactLabel,
  excludeUserIds,
}: {
  selectedUser: SearchUserHit | null;
  onSelect: (user: SearchUserHit) => void;
  onClear: () => void;
  placeholder: string;
  loadingLabel: string;
  emptyLabel: string;
  noContactLabel: string;
  excludeUserIds?: string[];
}) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchUserHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludedSet = useMemo(
    () => new Set(excludeUserIds ?? []),
    [excludeUserIds],
  );

  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const hits = await fetchUsersBySearchQuery(query);
      setResults(hits.filter((u) => !excludedSet.has(u._id)));
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludedSet]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsOpen(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => void fetchUsers(value), 300);
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
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {selectedUser.screenname}
          </p>
          {selectedUser.email && (
            <p className="text-xs text-gray-500 truncate">
              {selectedUser.email}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-gray-500 hover:text-gray-800 text-sm"
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
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        autoComplete="off"
      />
      {isOpen && (search.length >= 2 || results.length > 0) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-gray-500">{loadingLabel}</div>
          )}
          {!isLoading && results.length === 0 && search.length >= 2 && (
            <div className="px-3 py-2 text-sm text-gray-500">{emptyLabel}</div>
          )}
          {results.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => {
                onSelect(u);
                setSearch('');
                setIsOpen(false);
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium text-gray-900">
                {u.screenname}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {u.email
                  ? u.email
                  : u.walletAddress
                    ? `${u.walletAddress.slice(0, 6)}…${u.walletAddress.slice(-4)}`
                    : noContactLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
