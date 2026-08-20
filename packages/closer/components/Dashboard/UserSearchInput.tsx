import Link from 'next/link';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  fetchUsersBySearchQuery,
  type SearchUserHit,
} from '../../utils/searchUser';
import ProfilePhoto from '../ProfilePhoto';
import IdDisplay from '../display/idDisplay';

export type UserSearchResult = SearchUserHit;

const truncateWallet = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const UserSearchInput = ({
  selectedUser,
  onSelect,
  onClear,
  placeholder,
  showWallet = false,
}: {
  selectedUser: UserSearchResult | null;
  onSelect: (user: UserSearchResult) => void;
  onClear: () => void;
  placeholder: string;
  /** Token distribution cares about the wallet; sales care about the email. */
  showWallet?: boolean;
}) => {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      setResults(await fetchUsersBySearchQuery(query));
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
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
        <ProfilePhoto user={selectedUser} size="10" stack={false} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-medium">
            {selectedUser.screenname}
          </p>
          {selectedUser.email ? (
            <p className="truncate text-xs text-muted-foreground">
              {selectedUser.email}
            </p>
          ) : null}
          {showWallet && selectedUser.walletAddress ? (
            <p className="truncate font-mono text-xs text-muted-foreground">
              {truncateWallet(selectedUser.walletAddress)}
            </p>
          ) : null}
          <IdDisplay
            value={selectedUser._id}
            className="text-xs text-muted-foreground"
          />
          <Link
            href={`/members/${selectedUser._id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent underline"
          >
            {t('user_search_view_profile')}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
          aria-label={t('generic_clear_selection')}
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
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('generic_loading')}
            </div>
          )}
          {!isLoading && results.length === 0 && search.length >= 2 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {t('users_table_empty')}
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50"
            >
              <ProfilePhoto user={user} size="8" stack={false} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.screenname}
                </span>
                {user.email ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
                {showWallet && user.walletAddress ? (
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {truncateWallet(user.walletAddress)}
                  </span>
                ) : null}
                {/* A copy button here would nest a button inside this row's button. */}
                <IdDisplay
                  value={user._id}
                  showCopy={false}
                  className="text-xs text-muted-foreground"
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchInput;
