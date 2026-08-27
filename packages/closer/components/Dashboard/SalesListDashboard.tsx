import Link from 'next/link';
import { useRouter } from 'next/router';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { useAuth } from '../../contexts/auth';
import { Sale, SaleBuyer } from '../../types/api';
import {
  SafeProposalSkipCode,
  SafeProposalSkippedSale,
  TokenDistributionStatus,
  TokenUserResult,
} from '../../types/onchainAdmin';
import api, { formatSearch } from '../../utils/api';
import { getApiErrorDetails } from '../../utils/apiError';
import {
  tokenSaleStatusBadgeVariant,
  tokenSaleStatusLabelKey,
} from '../../utils/orderStatusBadge';
import {
  buildTdfTransaction,
  downloadTransactionBuilderJson,
} from '../../utils/safeTransactionBuilder';
import {
  type SaleCategory,
  isTokenProductSale,
  resolveSaleCategory,
  saleCategoryLabelKey,
} from '../../utils/saleCategory';
import { formatSaleAmount } from '../../utils/saleCurrency';
import {
  getSaleParticipant,
  getSaleProductTitle,
  saleNeedsAttentionHighlight,
} from '../../utils/saleParticipant';
import Modal from '../Modal';
import Pagination from '../Pagination';
import EmailDisplay from '../display/emailDisplay';
import IdDisplay from '../display/idDisplay';
import WalletDisplay from '../display/walletDisplay';
import { Input, Spinner } from '../ui/';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import BurnSweatModal from './BurnSweatModal';
import ManualSaleModal from './ManualSaleModal';
import MintSweatModal from './MintSweatModal';
import SaleDetails from './SaleDetails';
import TransferTdfModal from './TransferTdfModal';

const SALES_PER_PAGE = 20;
const DEFAULT_STATUS_TO_SHOW = 'paid';
const EVM_TRANSACTION_HASH_PATTERN = /^0x[a-f\d]{64}$/i;

type BuyerRecord = {
  _id: string;
  email?: string;
  screenname?: string;
  walletAddress?: string | null;
};

type TokenDistributionSyncResult = {
  checked: number;
  newlyFinalized: number;
  pending: number;
  inProgress: number;
  completed: number;
  completedWithWarnings: number;
  failed: number;
  superseded: number;
  needsReview: number;
};

function enrichSalesWithBuyers<T extends { createdBy?: string }>(
  salesArray: T[],
  buyers: BuyerRecord[],
): (T & { buyer: SaleBuyer | null })[] {
  return salesArray.map((sale) => {
    const buyer = buyers.find((b) => b._id === sale.createdBy);
    const existingBuyer = (sale as T & { buyer?: SaleBuyer | null }).buyer;
    return {
      ...sale,
      buyer: buyer
        ? {
            email: existingBuyer?.email || buyer.email || '',
            screenname: buyer.screenname || existingBuyer?.screenname || '',
            walletAddress: buyer.walletAddress || '',
            _id: buyer._id || '',
          }
        : existingBuyer ?? null,
    };
  });
}

const SalesListDashboard = ({
  sales,
  saleCategory,
  platformDefaultCurrency,
  onSuccess,
  currentPage,
  totalSales,
  salesPerPage,
  onPageChange,
  statusFilter: externalStatusFilter,
  onFilterChange,
  onRefetch,
}: {
  sales: Sale[] | null;
  saleCategory: SaleCategory;
  platformDefaultCurrency: string;
  onSuccess?: () => void;
  currentPage?: number;
  totalSales?: number;
  salesPerPage?: number;
  onPageChange?: (page: number) => void;
  statusFilter?: string;
  onFilterChange?: (filter: string) => void;
  onRefetch?: () => void;
}) => {
  const t = useTranslations();
  const router = useRouter();
  const intlLocale = router.locale || undefined;
  const { user: currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState(
    externalStatusFilter || DEFAULT_STATUS_TO_SHOW,
  );
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage || 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [enrichedSales, setEnrichedSales] = useState<Sale[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [manualDistributionError, setManualDistributionError] = useState('');

  const [isMatchBuyerModalOpen, setIsMatchBuyerModalOpen] = useState(false);
  const [matchableSales, setMatchableSales] = useState<Sale[]>([]);
  const [selectedMatchedSaleId, setSelectedMatchedSaleId] =
    useState<string>('');
  const [isLoadingMatchableSales, setIsLoadingMatchableSales] = useState(false);
  const [isMatchBuyerSuccess, setIsMatchBuyerSuccess] = useState(false);
  const isAdmin = currentUser?.roles.includes('admin');
  const isSpaceHost = currentUser?.roles?.includes('space-host');
  const isTeam = currentUser?.roles?.includes('team');
  const isTokenOperator = Boolean(isAdmin || isSpaceHost);

  const [isMintSweatModalOpen, setIsMintSweatModalOpen] = useState(false);
  const [isManualSaleModalOpen, setIsManualSaleModalOpen] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [isBurnSweatModalOpen, setIsBurnSweatModalOpen] = useState(false);
  const [isTransferTdfModalOpen, setIsTransferTdfModalOpen] = useState(false);
  const [isCreatingSafeProposal, setIsCreatingSafeProposal] = useState(false);
  const [safeProposalUrl, setSafeProposalUrl] = useState('');
  const [safeProposalError, setSafeProposalError] = useState('');
  const [safeProposalSummary, setSafeProposalSummary] = useState('');
  const [safeProposalSkipped, setSafeProposalSkipped] = useState<
    SafeProposalSkippedSale[]
  >([]);
  const [distributionStatuses, setDistributionStatuses] = useState<
    Record<string, TokenDistributionStatus>
  >({});
  const [isSyncingDistributions, setIsSyncingDistributions] = useState(false);
  const [distributionSyncSummary, setDistributionSyncSummary] = useState('');
  const [distributionSyncError, setDistributionSyncError] = useState('');
  const safeProposalIdempotencyRef = useRef<{
    fingerprint: string;
    requestId: string;
  } | null>(null);
  const enrichedSalesRequestGenerationRef = useRef(0);
  const distributionStatusRequestGenerationRef = useRef(0);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Fetch the narrow recipient view for token operators. Buyer matching remains
  // admin-only and continues to use the richer user response below.
  useEffect(() => {
    const requestGeneration = enrichedSalesRequestGenerationRef.current + 1;
    enrichedSalesRequestGenerationRef.current = requestGeneration;
    const isLatestRequest = () =>
      enrichedSalesRequestGenerationRef.current === requestGeneration;

    const fetchEnrichedSales = async () => {
      if (!sales || !isTokenOperator || saleCategory !== 'tokens') {
        if (isLatestRequest()) setEnrichedSales(sales || []);
        return;
      }

      try {
        const salesArray = Array.isArray(sales)
          ? sales
          : (sales as any).toJS
          ? (sales as any).toJS()
          : sales;

        // Get unique buyer IDs (createdBy represents the buyer in token sales)
        const uniqueBuyerIds = [
          ...new Set(salesArray.map((sale: any) => sale.createdBy)),
        ].filter(Boolean); // Remove any null/undefined values

        if (uniqueBuyerIds.length === 0) {
          if (isLatestRequest()) setEnrichedSales(salesArray);
          return;
        }
        const buyersRes = await api.get('/onchain-admin/recipients', {
          params: { ids: uniqueBuyerIds.join(',') },
        });
        const buyers = (buyersRes.data.results as TokenUserResult[]).map(
          (buyer) => ({
            ...buyer,
            walletAddress: buyer.hasWallet ? buyer.walletAddress : null,
          }),
        );
        if (!isLatestRequest()) return;
        setEnrichedSales(enrichSalesWithBuyers(salesArray, buyers));
      } catch (error) {
        if (!isLatestRequest()) return;
        console.error('Error fetching enriched sales data:', error);
        setEnrichedSales(sales);
      }
    };

    void fetchEnrichedSales();
    return () => {
      if (isLatestRequest()) enrichedSalesRequestGenerationRef.current += 1;
    };
  }, [sales, isTokenOperator, saleCategory]);

  // No client-side filtering needed - server handles it

  // Calculate pagination - use server-side if available, otherwise client-side
  const isServerSidePagination =
    totalSales !== undefined && salesPerPage !== undefined;
  const totalSalesCount = isServerSidePagination
    ? totalSales
    : enrichedSales.length;
  const itemsPerPage = isServerSidePagination ? salesPerPage : SALES_PER_PAGE;
  const totalPages = Math.ceil(totalSalesCount / itemsPerPage);

  // For server-side pagination, use enriched sales directly (they're already paginated)
  // For client-side pagination, slice the enriched sales
  const currentSales = isServerSidePagination
    ? enrichedSales || []
    : enrichedSales.slice(
        (localCurrentPage - 1) * itemsPerPage,
        localCurrentPage * itemsPerPage,
      );
  const visibleSaleIds = currentSales.map((sale) => sale._id).join(',');

  const fetchDistributionStatuses = useCallback(async () => {
    const requestGeneration =
      distributionStatusRequestGenerationRef.current + 1;
    distributionStatusRequestGenerationRef.current = requestGeneration;
    const isLatestRequest = () =>
      distributionStatusRequestGenerationRef.current === requestGeneration;

    if (!isTokenOperator || saleCategory !== 'tokens' || !visibleSaleIds) {
      if (isLatestRequest()) setDistributionStatuses({});
      return;
    }
    try {
      const response = await api.get('/safe/token-distribution-batches', {
        params: {
          chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
          saleIds: visibleSaleIds,
        },
        cache: false,
      } as any);
      const statuses = (response.data.results ??
        response.data) as TokenDistributionStatus[];
      if (!isLatestRequest()) return;
      setDistributionStatuses(
        Object.fromEntries(statuses.map((status) => [status.saleId, status])),
      );
    } catch (error) {
      if (!isLatestRequest()) return;
      console.error(
        'Error fetching automatic token distribution statuses:',
        error,
      );
    }
  }, [isTokenOperator, saleCategory, visibleSaleIds]);

  useEffect(() => {
    void fetchDistributionStatuses();
    return () => {
      distributionStatusRequestGenerationRef.current += 1;
    };
  }, [fetchDistributionStatuses]);

  // Handle filter changes
  const handleStatusFilterChange = (newFilter: string) => {
    setStatusFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    } else if (!isServerSidePagination) {
      setLocalCurrentPage(1);
    }
  };

  // Ensure current page is valid when total pages changes
  useEffect(() => {
    if (
      !isServerSidePagination &&
      localCurrentPage > totalPages &&
      totalPages > 0
    ) {
      setLocalCurrentPage(totalPages);
    }
  }, [totalPages, localCurrentPage, isServerSidePagination]);

  const handlePageChange = (page: number) => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(page);
    } else {
      setLocalCurrentPage(page);
    }
  };

  const getStatusBadge = (status: string) => (
    <Badge variant={tokenSaleStatusBadgeVariant(status)}>
      {t(tokenSaleStatusLabelKey(status))}
    </Badge>
  );

  const formatAmount = (sale: Sale) =>
    formatSaleAmount(sale, intlLocale, platformDefaultCurrency);

  const participantColumnLabel =
    saleCategory === 'donations'
      ? t('sales_dashboard_donor')
      : t('token_sales_dashboard_buyer');

  const handleDistributeTokens = (saleId: string) => {
    setSelectedSaleId(saleId);
    const automaticStatus = distributionStatuses[saleId];
    setTransactionId(
      automaticStatus?.status === 'needs-review'
        ? automaticStatus.executionTxHash
        : '',
    );
    setManualDistributionError('');
    setIsModalOpen(true);
  };

  const fetchMatchableSales = async () => {
    setIsLoadingMatchableSales(true);
    try {
      const where = {
        status: { $in: ['pending-payment', 'cancelled'] as const },
        product_type: { $in: ['token', 'tokens'] },
      };
      const res = await api.get('/sale', {
        params: { where: formatSearch(where), limit: 500 },
      });
      const rawSales = res.data?.results ?? [];
      const salesArray = Array.isArray(rawSales)
        ? rawSales
        : (rawSales as { toJS?: () => Sale[] }).toJS
        ? (rawSales as { toJS: () => Sale[] }).toJS()
        : rawSales;
      const uniqueBuyerIds = [
        ...new Set(
          (salesArray as Sale[]).map((s) => s.createdBy).filter(Boolean),
        ),
      ] as string[];
      if (uniqueBuyerIds.length === 0) {
        setMatchableSales(salesArray as Sale[]);
        setIsLoadingMatchableSales(false);
        return;
      }
      const buyersRes = await api.get(
        `/user?where=${encodeURIComponent(
          JSON.stringify({ _id: { $in: uniqueBuyerIds } }),
        )}&includePrivate=true`,
      );
      const buyers = (buyersRes.data?.results ?? []) as BuyerRecord[];
      setMatchableSales(
        enrichSalesWithBuyers(salesArray as Sale[], buyers) as Sale[],
      );
    } catch (err) {
      console.error('Error fetching matchable sales:', err);
      setMatchableSales([]);
    } finally {
      setIsLoadingMatchableSales(false);
    }
  };

  const handleShowMatchBuyerModal = (saleId: string) => {
    setSelectedSaleId(saleId);
    setSelectedMatchedSaleId('');
    setMatchableSales([]);
    setIsMatchBuyerModalOpen(true);
    setIsMatchBuyerSuccess(false);
    fetchMatchableSales();
  };

  const handleCloseMatchBuyerModal = () => {
    setIsMatchBuyerModalOpen(false);
    setSelectedSaleId('');
    setSelectedMatchedSaleId('');
    setMatchableSales([]);
    setIsMatchBuyerSuccess(false);
    setIsLoading(false);
  };

  // Auto-close modal after successful match
  useEffect(() => {
    if (isMatchBuyerSuccess) {
      const timer = setTimeout(() => {
        handleCloseMatchBuyerModal();
      }, 2000); // Close after 2 seconds to show success message
      return () => clearTimeout(timer);
    }
  }, [isMatchBuyerSuccess]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSaleId('');
    setTransactionId('');
    setIsSuccess(false);
    setIsLoading(false);
    setManualDistributionError('');
  };

  const handleSubmitTransaction = async () => {
    setIsSuccess(false);
    setManualDistributionError('');
    if (!transactionId.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/token-distribution-confirmation', {
        saleId: selectedSaleId,
        txHash: transactionId,
      });
      if (res.status === 200) {
        setIsSuccess(true);
        onSuccess?.();
        await fetchDistributionStatuses();
        await onRefetch?.();
      } else {
        setIsSuccess(false);
      }
    } catch (error) {
      const details = getApiErrorDetails(
        error,
        t('token_sales_dashboard_onchain_error'),
      );
      setManualDistributionError(details.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMatchedSale = (saleId: string) => {
    setSelectedMatchedSaleId(saleId);
  };

  const handleMatchBuyer = async () => {
    if (!selectedMatchedSaleId) return;
    setIsLoading(true);
    try {
      await api.post('/sale/buyer-match', {
        saleId: selectedSaleId,
        matchedSaleId: selectedMatchedSaleId,
      });
      const matchedSale = matchableSales.find(
        (s) => s._id === selectedMatchedSaleId,
      );
      const buyerToApply = matchedSale?.buyer ?? null;
      setEnrichedSales((prev) =>
        prev.map((sale) =>
          sale._id === selectedSaleId ? { ...sale, buyer: buyerToApply } : sale,
        ),
      );
      setIsMatchBuyerSuccess(true);
      if (onRefetch) await onRefetch();
    } catch (error) {
      console.error('Error matching buyer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(intlLocale || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const paidSalesWithWallet = enrichedSales.filter(
    (sale) =>
      isTokenProductSale(sale) &&
      sale.status === 'paid' &&
      sale.buyer?.walletAddress &&
      sale.quantity,
  );

  const canTokenOperatorAction = saleCategory === 'tokens' && isTokenOperator;
  // POST /sale/manual is restricted to admin and team on the API side.
  const canAddManualSale = Boolean(isAdmin || isTeam);
  const canBatchSafeTxAction =
    saleCategory === 'tokens' &&
    statusFilter === 'paid' &&
    isTokenOperator &&
    totalSalesCount > 0;
  const hasHeaderActions = canTokenOperatorAction || canAddManualSale;

  const toggleSaleDetails = (saleId: string) =>
    setExpandedSaleId((current) => (current === saleId ? null : saleId));
  const selectedDistributionStatus = distributionStatuses[selectedSaleId];
  const manualDistributionBlocked = Boolean(
    selectedDistributionStatus?.active &&
      selectedDistributionStatus.status !== 'needs-review',
  );
  const hasValidManualTransactionHash = EVM_TRANSACTION_HASH_PATTERN.test(
    transactionId.trim(),
  );

  const renderParticipant = (sale: Sale) => {
    const participant = getSaleParticipant(sale);
    if (!participant) {
      return (
        <div className="text-muted-foreground text-sm">
          {t('token_sales_dashboard_unknown_buyer')}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        {participant.memberId && !participant.isGuest ? (
          <Link
            href={`/members/${participant.memberId}`}
            className="bg-accent text-background px-2 py-0.5 rounded-full w-fit text-sm"
          >
            {participant.label}
          </Link>
        ) : (
          <span className="font-medium text-sm">{participant.label}</span>
        )}
        {isAdmin && participant.email ? (
          <div className="min-w-0 text-sm text-muted-foreground">
            <EmailDisplay
              email={participant.email}
              className="text-sm font-normal text-muted-foreground no-underline hover:underline"
            />
          </div>
        ) : null}
        {isTokenProductSale(sale) &&
        sale.buyer?.walletAddress &&
        isTokenOperator ? (
          <div className="min-w-0 text-xs text-muted-foreground">
            <WalletDisplay
              address={sale.buyer.walletAddress}
              className="text-xs"
            />
          </div>
        ) : isTokenProductSale(sale) &&
          isTokenOperator &&
          sale.buyer &&
          !sale.buyer.walletAddress ? (
          <div className="text-xs text-muted-foreground">
            {t('token_sales_dashboard_no_wallet_address')}
          </div>
        ) : null}
      </div>
    );
  };

  const renderQuantity = (sale: Sale) => {
    if (isTokenProductSale(sale)) {
      return sale.createdBy ? sale.quantity ?? 0 : 'N/A';
    }
    return sale.quantity ?? '—';
  };

  const distributionStatusLabel = (status: TokenDistributionStatus) => {
    switch (status.status) {
      case 'pending':
      case 'creating':
        return t('token_sales_dashboard_safe_automatic_pending', {
          submitted: status.confirmationsSubmitted,
          required: status.confirmationsRequired,
        });
      case 'finalizing':
        return t('token_sales_dashboard_safe_automatic_finalizing');
      case 'needs-review':
        return t('token_sales_dashboard_safe_automatic_review');
      case 'completed-with-warnings':
        return t('token_sales_dashboard_safe_automatic_completed_warning');
      case 'failed':
      case 'superseded':
        return t('token_sales_dashboard_safe_automatic_failed');
      case 'completed':
        return t('token_sales_dashboard_safe_automatic_completed');
      default:
        return t('token_sales_dashboard_safe_automatic_unknown', {
          status: status.status,
        });
    }
  };

  const renderSaleActions = (sale: Sale) => {
    if (!isTokenProductSale(sale)) {
      return (
        <Link
          href={`/sale/${sale._id}`}
          className="text-xs text-accent underline"
        >
          {t('sales_dashboard_view_sale')}
        </Link>
      );
    }
    const automaticStatus = distributionStatuses[sale._id];
    return (
      <div className="flex flex-col items-start gap-2">
        {automaticStatus && (
          <div
            className={`max-w-xs rounded border px-2 py-1 text-xs ${
              automaticStatus.status === 'needs-review' ||
              automaticStatus.status === 'completed-with-warnings' ||
              automaticStatus.status === 'failed' ||
              automaticStatus.status === 'superseded'
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            <div>{distributionStatusLabel(automaticStatus)}</div>
            <div className="flex flex-col items-start gap-1">
              {automaticStatus.safeUrl && (
                <a
                  href={automaticStatus.safeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t('token_sales_dashboard_open_safe')}
                </a>
              )}
              {(automaticStatus.entryLastError ||
                automaticStatus.lastError) && (
                <span>
                  {automaticStatus.entryLastError || automaticStatus.lastError}
                </span>
              )}
            </div>
          </div>
        )}
        {isTokenOperator &&
          sale.status !== 'matched' &&
          (sale.status === 'paid' ||
            (sale.status === 'completed' &&
              automaticStatus?.status === 'needs-review')) &&
          sale.buyer && (
            <Button
              size="small"
              onClick={() => handleDistributeTokens(sale._id)}
              className="text-xs w-fit rounded-full text-background py-1 h-fit"
            >
              {t('token_sales_dashboard_distribute_tokens')}
            </Button>
          )}
        {isAdmin && sale.status !== 'matched' && !getSaleParticipant(sale) && (
          <Button
            size="small"
            onClick={() => handleShowMatchBuyerModal(sale._id)}
            className="text-xs w-fit rounded-full text-background py-1 h-fit"
          >
            {t('token_sales_dashboard_match_buyer_manually')}
          </Button>
        )}
      </div>
    );
  };

  const rowHighlightClass = (sale: Sale) =>
    saleNeedsAttentionHighlight(sale, getSaleParticipant(sale))
      ? 'bg-yellow-100'
      : '';

  useEffect(() => {
    if (!actionsMenuOpen) {
      return;
    }
    const handlePointerDown = (e: PointerEvent) => {
      if (
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(e.target as Node)
      ) {
        setActionsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActionsMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionsMenuOpen]);

  const handleExportBatchSafeTx = () => {
    const tokenSymbol = blockchainConfig.BLOCKCHAIN_DAO_TOKEN.symbol;
    const transactions = paidSalesWithWallet.map((sale) =>
      buildTdfTransaction(
        'mint',
        sale.buyer!.walletAddress!,
        String(sale.quantity),
      ),
    );
    downloadTransactionBuilderJson({
      name: `${tokenSymbol} token mint batch`,
      description: `Mint ${tokenSymbol} to ${transactions.length} member addresses`,
      filename: `batch-safe-tx-${new Date().toISOString().slice(0, 10)}.json`,
      transactions,
    });
  };

  const skippedReason = (item: SafeProposalSkippedSale) => {
    const keys: Record<SafeProposalSkipCode, string> = {
      USER_NOT_FOUND: 'token_sales_dashboard_skip_user_not_found',
      NO_WALLET: 'token_sales_dashboard_skip_no_wallet',
      INVALID_WALLET: 'token_sales_dashboard_skip_invalid_wallet',
      INVALID_AMOUNT: 'token_sales_dashboard_skip_invalid_amount',
    };
    return keys[item.code] ? t(keys[item.code]) : item.reason || item.code;
  };

  const handleCreateBatchSafeTx = async () => {
    setIsCreatingSafeProposal(true);
    setSafeProposalError('');
    setSafeProposalUrl('');
    setSafeProposalSummary('');
    setSafeProposalSkipped([]);
    try {
      const fingerprint = 'all-untracked-paid-token-sales';
      if (safeProposalIdempotencyRef.current?.fingerprint !== fingerprint) {
        safeProposalIdempotencyRef.current = {
          fingerprint,
          requestId:
            window.crypto?.randomUUID?.() ??
            `tdf-mint-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        };
      }
      const response = await api.post('/safe/token-distribution-batches', {
        requestId: safeProposalIdempotencyRef.current.requestId,
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
      });
      const result = response.data.results ?? response.data;
      const batches = result.batches ?? [];
      const skipped = result.skipped ?? [];
      const saleCount = batches.reduce(
        (total: number, batch: { saleCount?: number }) =>
          total + Number(batch.saleCount || 0),
        0,
      );
      const safeUrl = batches.find(
        (batch: { safeUrl?: string }) => batch.safeUrl,
      )?.safeUrl;
      setSafeProposalUrl(safeUrl ?? '');
      setSafeProposalSkipped(skipped);
      setSafeProposalSummary(
        batches.length > 0
          ? t('token_sales_dashboard_safe_batch_created_summary', {
              batches: batches.length,
              sales: saleCount,
            })
          : t('token_sales_dashboard_safe_batch_no_eligible'),
      );
      if (safeUrl) {
        window.open(safeUrl, '_blank', 'noopener,noreferrer');
      }
      safeProposalIdempotencyRef.current = null;
      await fetchDistributionStatuses();
    } catch (proposalError) {
      setSafeProposalError(
        getApiErrorDetails(
          proposalError,
          t('token_sales_dashboard_onchain_error'),
        ).message,
      );
    } finally {
      setIsCreatingSafeProposal(false);
    }
  };

  const handleSyncTokenDistributions = async () => {
    setIsSyncingDistributions(true);
    setDistributionSyncError('');
    setDistributionSyncSummary('');
    try {
      const response = await api.post('/safe/token-distribution-batches/sync', {
        chainId: blockchainConfig.BLOCKCHAIN_NETWORK_ID,
      });
      const result = (response.data.results ??
        response.data) as TokenDistributionSyncResult;
      setDistributionSyncSummary(
        t('token_sales_dashboard_safe_sync_summary', {
          checked: result.checked,
          finalized: result.newlyFinalized,
          pending: result.inProgress ?? result.pending,
          review: result.needsReview,
          warnings: result.completedWithWarnings,
        }),
      );
      await fetchDistributionStatuses();
      await onRefetch?.();
    } catch (syncError) {
      setDistributionSyncError(
        getApiErrorDetails(syncError, t('token_sales_dashboard_onchain_error'))
          .message,
      );
    } finally {
      setIsSyncingDistributions(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-background">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground font-bold">
              {totalSalesCount}{' '}
              {statusFilter === 'all'
                ? t('token_sales_dashboard_total_sales')
                : statusFilter}{' '}
              {t('token_sales_dashboard_sales')}
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                {t('token_sales_dashboard_showing')}{' '}
                {(localCurrentPage - 1) * itemsPerPage + 1}-
                {Math.min(localCurrentPage * itemsPerPage, totalSalesCount)}{' '}
                {t('token_sales_dashboard_of')} {totalSalesCount}{' '}
                {t('token_sales_dashboard_sales')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasHeaderActions && (
              <div className="relative" ref={actionsMenuRef}>
                <Button
                  type="button"
                  size="small"
                  onClick={() => setActionsMenuOpen((open) => !open)}
                  className="text-xs rounded-full text-background h-fit gap-1 py-1"
                  aria-expanded={actionsMenuOpen}
                  aria-haspopup="menu"
                >
                  {t('generic_actions')}
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                      actionsMenuOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </Button>
                {actionsMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1 min-w-[12rem] rounded-md border border-border bg-background py-1 shadow-md"
                  >
                    {canAddManualSale && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setIsManualSaleModalOpen(true);
                        }}
                      >
                        {t('manual_sale_add_button')}
                      </button>
                    )}
                    {canTokenOperatorAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setIsMintSweatModalOpen(true);
                        }}
                      >
                        {t('token_sales_dashboard_mint_sweat_button')}
                      </button>
                    )}
                    {canTokenOperatorAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setIsBurnSweatModalOpen(true);
                        }}
                      >
                        {t('token_sales_dashboard_burn_sweat_button')}
                      </button>
                    )}
                    {canTokenOperatorAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setIsTransferTdfModalOpen(true);
                        }}
                      >
                        {t('token_sales_dashboard_transfer_tdf_button')}
                      </button>
                    )}
                    {canBatchSafeTxAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          void handleCreateBatchSafeTx();
                        }}
                        disabled={isCreatingSafeProposal}
                      >
                        {isCreatingSafeProposal
                          ? t('token_sales_dashboard_creating_safe_proposal')
                          : t('token_sales_dashboard_create_batch_safe_tx')}
                      </button>
                    )}
                    {canBatchSafeTxAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          handleExportBatchSafeTx();
                        }}
                      >
                        {t('token_sales_dashboard_export_tdf_mint_json')}
                      </button>
                    )}
                    {canTokenOperatorAction && (
                      <button
                        type="button"
                        role="menuitem"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          void handleSyncTokenDistributions();
                        }}
                        disabled={isSyncingDistributions}
                      >
                        {isSyncingDistributions
                          ? t('token_sales_dashboard_safe_syncing')
                          : t('token_sales_dashboard_safe_sync_now')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <span className="text-sm">
              {t('token_sales_dashboard_select_status')}
            </span>
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-40 md:w-48">
                <SelectValue
                  placeholder={t('token_sales_dashboard_filter_by_status')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending-payment">
                  {t('token_sales_dashboard_pending_payment')}
                </SelectItem>
                <SelectItem value="completed">
                  {t('token_sales_dashboard_completed')}
                </SelectItem>
                <SelectItem value="paid">
                  {t('token_sales_dashboard_paid')}
                </SelectItem>
                <SelectItem value="matched">
                  {t('token_sales_dashboard_matched')}
                </SelectItem>
                <SelectItem value="cancelled">
                  {t('token_sales_dashboard_cancelled')}
                </SelectItem>
                <SelectItem value="all">
                  {t('token_sales_dashboard_all_sales')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(safeProposalUrl ||
          safeProposalError ||
          safeProposalSummary ||
          safeProposalSkipped.length > 0) && (
          <div
            className={`mt-3 rounded-lg border p-3 text-sm ${
              safeProposalError
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-green-300 bg-green-50 text-green-800'
            }`}
          >
            {safeProposalError ||
              safeProposalSummary ||
              t('token_sales_dashboard_safe_proposal_created')}
            {safeProposalUrl && (
              <a
                href={safeProposalUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 underline"
              >
                {t('token_sales_dashboard_open_safe')}
              </a>
            )}
            {safeProposalSkipped.length > 0 && (
              <div className="mt-2">
                <p>
                  {t('token_sales_dashboard_safe_batch_skipped', {
                    count: safeProposalSkipped.length,
                  })}
                </p>
                <ul className="mt-1 list-disc pl-5">
                  {safeProposalSkipped.slice(0, 10).map((item) => (
                    <li key={item.saleId}>
                      {item.saleId}: {skippedReason(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {(distributionSyncSummary || distributionSyncError) && (
          <div
            className={`mt-3 rounded-lg border p-3 text-sm ${
              distributionSyncError
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {distributionSyncError || distributionSyncSummary}
          </div>
        )}
        {/* Mobile card layout */}
        <div className="md:hidden space-y-3">
          {currentSales.map((sale: Sale) => {
            const typeLabel = t(
              saleCategoryLabelKey(resolveSaleCategory(sale)),
            );
            return (
              <div
                key={sale._id}
                className={`${rowHighlightClass(
                  sale,
                )} border border-border rounded-lg p-4 space-y-3`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px]">
                      {typeLabel}
                    </Badge>
                    <div className="font-medium">
                      {getSaleProductTitle(sale, typeLabel)}
                    </div>
                    {sale.entity ? (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {sale.entity}
                      </div>
                    ) : null}
                  </div>
                  {getStatusBadge(sale.status)}
                </div>
                <div>{renderParticipant(sale)}</div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      {t('token_sales_dashboard_quantity')}:{' '}
                    </span>
                    {renderQuantity(sale)}
                  </div>
                  <div className="font-mono">{formatAmount(sale)}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(sale.created)}
                  </span>
                  <div className="flex gap-2">{renderSaleActions(sale)}</div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                  <IdDisplay
                    value={sale._id}
                    className="text-xs text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => toggleSaleDetails(sale._id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    aria-expanded={expandedSaleId === sale._id}
                  >
                    {t('sale_details_toggle')}
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        expandedSaleId === sale._id ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                </div>
                {expandedSaleId === sale._id && (
                  <SaleDetails sale={sale} locale={intlLocale} />
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop table layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium align-top">
                  {t('token_sales_dashboard_product_name')}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {participantColumnLabel}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {t('token_sales_dashboard_quantity')}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {t('token_sales_dashboard_price')}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {t('token_sales_dashboard_status')}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {t('token_sales_dashboard_created')}
                </th>
                <th className="text-left p-4 font-medium align-top">
                  {t('sale_details_sale_id')}
                </th>
                <th className="w-10 p-4">
                  <span className="sr-only">{t('sale_details_toggle')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale: Sale) => {
                const typeLabel = t(
                  saleCategoryLabelKey(resolveSaleCategory(sale)),
                );
                const isExpanded = expandedSaleId === sale._id;
                return (
                  <Fragment key={sale._id}>
                    <tr
                      className={`${rowHighlightClass(
                        sale,
                      )} border-b border-border hover:bg-muted/50`}
                    >
                      <td className="p-4 font-medium align-top">
                        <Badge variant="outline" className="mb-1 text-[10px]">
                          {typeLabel}
                        </Badge>
                        <div>{getSaleProductTitle(sale, typeLabel)}</div>
                        {sale.entity ? (
                          <div className="text-xs text-muted-foreground font-normal mt-0.5">
                            {sale.entity}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4 align-top">
                        {renderParticipant(sale)}
                      </td>
                      <td className="p-4 align-top">{renderQuantity(sale)}</td>
                      <td className="p-4 font-mono align-top">
                        {formatAmount(sale)}
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-2">
                          {getStatusBadge(sale.status)}
                          {renderSaleActions(sale)}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground align-top whitespace-nowrap">
                        {formatDate(sale.created)}
                      </td>
                      <td className="p-4 align-top">
                        <IdDisplay
                          value={sale._id}
                          className="text-xs text-muted-foreground"
                        />
                      </td>
                      <td className="p-4 align-top">
                        <button
                          type="button"
                          onClick={() => toggleSaleDetails(sale._id)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-expanded={isExpanded}
                          aria-label={t('sale_details_toggle')}
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border bg-muted/20">
                        <td colSpan={8} className="p-4">
                          <SaleDetails sale={sale} locale={intlLocale} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {currentSales.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t('token_sales_dashboard_no_sales_found')} {statusFilter}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              loadPage={handlePageChange}
              queryParam="page"
              total={totalSalesCount}
              page={
                isServerSidePagination ? currentPage || 1 : localCurrentPage
              }
              limit={itemsPerPage}
              maxPages={5}
            />
          </div>
        )}
      </Card>

      {isModalOpen && (
        <Modal closeModal={handleCloseModal}>
          <div className="space-y-4 md:space-y-6">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-2">
                {t('token_sales_dashboard_distribute_tokens_modal_title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('token_sales_dashboard_enter_transaction_id')}{' '}
              </p>
              <p>
                {
                  enrichedSales?.find(
                    (sale: Sale) => sale._id === selectedSaleId,
                  )?.buyer?.screenname
                }
              </p>
            </div>

            {selectedDistributionStatus && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">
                  {distributionStatusLabel(selectedDistributionStatus)}
                </p>
                <p className="mt-1">
                  {manualDistributionBlocked
                    ? t('token_sales_dashboard_safe_manual_automatic_notice')
                    : t('token_sales_dashboard_safe_manual_recovery_notice')}
                </p>
                {selectedDistributionStatus.safeUrl && (
                  <a
                    href={selectedDistributionStatus.safeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block underline"
                  >
                    {t('token_sales_dashboard_open_safe')}
                  </a>
                )}
                {(selectedDistributionStatus.entryLastError ||
                  selectedDistributionStatus.lastError) && (
                  <p className="mt-1">
                    {selectedDistributionStatus.entryLastError ||
                      selectedDistributionStatus.lastError}
                  </p>
                )}
              </div>
            )}

            {!manualDistributionBlocked && (
              <div className="space-y-2">
                <label
                  htmlFor="transactionId"
                  className="block text-sm font-medium"
                >
                  {t('token_sales_dashboard_transaction_id')}
                </label>
                <Input
                  id="transactionId"
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder={t(
                    'token_sales_dashboard_enter_transaction_id_placeholder',
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                {transactionId.trim() && !hasValidManualTransactionHash && (
                  <p className="text-sm text-red-500">
                    {t('token_sales_dashboard_invalid_transaction_hash')}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                isEnabled={!isLoading}
              >
                {t('token_sales_dashboard_cancel')}
              </Button>
              {manualDistributionBlocked ? (
                <Button
                  onClick={() => void handleSyncTokenDistributions()}
                  isEnabled={!isSyncingDistributions}
                  isLoading={isSyncingDistributions}
                >
                  {t('token_sales_dashboard_safe_sync_now')}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitTransaction}
                  isEnabled={
                    hasValidManualTransactionHash && !isLoading && !isSuccess
                  }
                  isLoading={isLoading}
                >
                  {isLoading
                    ? t('token_sales_dashboard_distributing')
                    : t('token_sales_dashboard_distribute_tokens_button')}
                </Button>
              )}
            </div>
            {manualDistributionError && (
              <div className="text-red-500">{manualDistributionError}</div>
            )}
            {isSuccess && (
              <div className="text-green-500">
                {t('token_sales_dashboard_success_message')}
              </div>
            )}
          </div>
        </Modal>
      )}
      {isMintSweatModalOpen && (
        <MintSweatModal onClose={() => setIsMintSweatModalOpen(false)} />
      )}
      {isBurnSweatModalOpen && (
        <BurnSweatModal onClose={() => setIsBurnSweatModalOpen(false)} />
      )}
      {isTransferTdfModalOpen && (
        <TransferTdfModal onClose={() => setIsTransferTdfModalOpen(false)} />
      )}

      {isManualSaleModalOpen && (
        <ManualSaleModal
          onClose={() => setIsManualSaleModalOpen(false)}
          onCreated={onRefetch}
          defaultCurrency={platformDefaultCurrency}
        />
      )}

      {isMatchBuyerModalOpen && (
        <Modal
          closeModal={handleCloseMatchBuyerModal}
          className="md:w-[800px] md:max-w-[90vw]"
        >
          <div className="flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="space-y-4 md:space-y-6 flex-shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">
                  {t('token_sales_dashboard_match_buyer_manually_title')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('token_sales_dashboard_match_buyer_manually_description')}
                </p>
              </div>

              {isLoadingMatchableSales ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Spinner />
                  {t('token_sales_dashboard_match_buyer_loading')}
                </div>
              ) : (
                <>
                  {/* Mobile card layout */}
                  <div className="md:hidden space-y-2">
                    {matchableSales
                      .filter((s) => s._id !== selectedSaleId)
                      .map((sale) => (
                        <button
                          key={sale._id}
                          type="button"
                          onClick={() => handleSelectMatchedSale(sale._id)}
                          className={`w-full text-left border rounded-lg p-3 space-y-1 ${
                            selectedMatchedSaleId === sale._id
                              ? 'border-accent bg-accent/20'
                              : 'border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">
                              {formatAmount(sale)}
                            </span>
                            {getStatusBadge(sale.status)}
                          </div>
                          <div className="min-w-0 text-sm">
                            {sale.buyer?.email ? (
                              <EmailDisplay
                                email={sale.buyer.email}
                                className="truncate text-sm font-normal text-foreground no-underline hover:underline"
                              />
                            ) : (
                              '—'
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {t('token_sales_dashboard_quantity')}:{' '}
                              {sale.createdBy ? sale.quantity ?? 0 : 'N/A'}
                            </span>
                            <span>{formatDate(sale.created)}</span>
                          </div>
                        </button>
                      ))}
                  </div>

                  {/* Desktop table layout */}
                  <div className="hidden md:block overflow-x-auto border border-border rounded-md">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-muted">
                        <tr className="border-b border-border">
                          <th className="text-left p-2 font-medium">
                            {t('token_sales_dashboard_price')}
                          </th>
                          <th className="text-left p-2 font-medium">
                            {t('token_sales_dashboard_buyer_email')}
                          </th>
                          <th className="text-left p-2 font-medium">
                            {t('token_sales_dashboard_quantity')}
                          </th>
                          <th className="text-left p-2 font-medium">
                            {t('token_sales_dashboard_status')}
                          </th>
                          <th className="text-left p-2 font-medium">
                            {t('token_sales_dashboard_created')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchableSales
                          .filter((s) => s._id !== selectedSaleId)
                          .map((sale) => (
                            <tr
                              key={sale._id}
                              onClick={() => handleSelectMatchedSale(sale._id)}
                              className={`border-b border-border cursor-pointer hover:bg-muted/50 ${
                                selectedMatchedSaleId === sale._id
                                  ? 'bg-accent/20'
                                  : ''
                              }`}
                            >
                              <td className="p-2 font-mono">
                                {formatAmount(sale)}
                              </td>
                              <td className="max-w-[220px] min-w-0 p-2">
                                {sale.buyer?.email ? (
                                  <EmailDisplay
                                    email={sale.buyer.email}
                                    className="text-sm font-normal text-foreground no-underline hover:underline"
                                  />
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="p-2">
                                {sale.createdBy ? sale.quantity ?? 0 : 'N/A'}
                              </td>
                              <td className="p-2">
                                {getStatusBadge(sale.status)}
                              </td>
                              <td className="p-2 text-muted-foreground whitespace-nowrap">
                                {formatDate(sale.created)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!isLoadingMatchableSales &&
                matchableSales.filter((s) => s._id !== selectedSaleId)
                  .length === 0 && (
                  <p className="text-muted-foreground">
                    {t('token_sales_dashboard_match_buyer_no_sales')}
                  </p>
                )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={handleCloseMatchBuyerModal}
                  isEnabled={!isLoading}
                >
                  {t('token_sales_dashboard_cancel')}
                </Button>
                <Button
                  onClick={handleMatchBuyer}
                  isEnabled={
                    Boolean(selectedMatchedSaleId) &&
                    !isLoading &&
                    !isMatchBuyerSuccess
                  }
                  isLoading={isLoading}
                >
                  {isLoading
                    ? t('token_sales_dashboard_match_buyer_submitting')
                    : t('token_sales_dashboard_match_buyer_submit')}
                </Button>
              </div>
              {isMatchBuyerSuccess && (
                <div className="text-green-500">
                  {t('token_sales_dashboard_match_buyer_success')}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesListDashboard;
