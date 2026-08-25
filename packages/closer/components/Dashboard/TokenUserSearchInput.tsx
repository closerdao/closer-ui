import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { useTranslations } from 'next-intl';

import { TokenUserResult } from '../../types/onchainAdmin';
import api from '../../utils/api';

const TokenUserSearchInput = ({
  selectedUser,
  onSelect,
  onClear,
  placeholder,
}: {
  selectedUser: TokenUserResult | null;
  onSelect: (user: TokenUserResult) => void;
  onClear: () => void;
  placeholder: string;
}) => {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TokenUserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestGenerationRef = useRef(0);

  const positionDropdown = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const maxHeight = 192;
    const roomBelow = window.innerHeight - rect.bottom;
    const opensAbove = roomBelow < maxHeight + 12 && rect.top > roomBelow;
    setDropdownStyle({
      position: 'fixed',
      zIndex: 1000,
      left: rect.left,
      width: rect.width,
      ...(opensAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  const fetchUsers = useCallback(async (query: string, generation: number) => {
    if (query.length < 2) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const { data } = await api.get('/onchain-admin/recipients', {
        params: { q: query, limit: 10 },
      });
      if (requestGenerationRef.current !== generation) return;
      setResults(data.results || []);
    } catch {
      if (requestGenerationRef.current !== generation) return;
      setResults([]);
      setHasError(true);
    } finally {
      if (requestGenerationRef.current === generation) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    positionDropdown();
    window.addEventListener('resize', positionDropdown);
    window.addEventListener('scroll', positionDropdown, true);
    return () => {
      window.removeEventListener('resize', positionDropdown);
      window.removeEventListener('scroll', positionDropdown, true);
    };
  }, [isOpen, positionDropdown]);

  useEffect(
    () => () => {
      requestGenerationRef.current += 1;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
        <span className="truncate text-sm font-medium">
          {selectedUser.screenname}
        </span>
        <span className="max-w-[150px] truncate font-mono text-xs text-muted-foreground">
          {selectedUser.hasWallet
            ? `${selectedUser.walletAddress.slice(
                0,
                6,
              )}...${selectedUser.walletAddress.slice(-4)}`
            : t('token_sales_dashboard_no_wallet_address')}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-sm text-muted-foreground hover:text-foreground"
          aria-label={t('generic_remove')}
        >
          ✕
        </button>
      </div>
    );
  }

  const dropdown =
    isOpen && search.length >= 2 && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-lg"
          >
            {isLoading && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {t('token_sales_dashboard_user_search_loading')}
              </div>
            )}
            {!isLoading && hasError && (
              <div className="px-3 py-2 text-sm text-destructive">
                {t('token_sales_dashboard_user_search_error')}
              </div>
            )}
            {!isLoading && !hasError && results.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {t('token_sales_dashboard_user_search_empty')}
              </div>
            )}
            {!isLoading &&
              results.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    requestGenerationRef.current += 1;
                    onSelect(user);
                    setSearch('');
                    setIsOpen(false);
                    setResults([]);
                  }}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{user.screenname}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {user.hasWallet
                      ? `${user.walletAddress.slice(
                          0,
                          6,
                        )}...${user.walletAddress.slice(-4)}`
                      : t('token_sales_dashboard_no_wallet_address')}
                  </span>
                </button>
              ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={search}
        onChange={(event) => {
          const value = event.target.value;
          const generation = requestGenerationRef.current + 1;
          requestGenerationRef.current = generation;
          setSearch(value);
          setIsOpen(true);
          setHasError(false);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          if (value.length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
          }
          debounceRef.current = setTimeout(
            () => fetchUsers(value, generation),
            300,
          );
        }}
        onFocus={() => search.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {dropdown}
    </div>
  );
};

export default TokenUserSearchInput;
