import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import { useAuth } from '../../contexts/auth';
import { TokenSale } from '../../types/api';
import api, { formatSearch } from '../../utils/api';
import { formatIsoFiatAmount, parseTokenUnits } from '../../utils/currencyFormat';
import MintSweatModal from './MintSweatModal';
import Modal from '../Modal';
import Pagination from '../Pagination';
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

const SALES_PER_PAGE = 20;
const DEFAULT_STATUS_TO_SHOW = 'paid';

type BuyerRecord = {
  _id: string;
  email?: string;
  screenname?: string;
  walletAddress?: string;
};

function enrichSalesWithBuyers<T extends { createdBy?: string }>(
  salesArray: T[],
  buyers: BuyerRecord[],
): (T & { buyer: TokenSale['buyer'] })[] {
  return salesArray.map((sale) => {
    const buyer = buyers.find((b) => b._id === sale.createdBy);
    return {
      ...sale,
      buyer: buyer
        ? {
            email: buyer.email || '',
            screenname: buyer.screenname || '',
            walletAddress: buyer.walletAddress || '',
            _id: buyer._id || '',
          }
        : null,
    };
  });
}

const SalesDashboard = ({
  sales,
  onSuccess,
  currentPage,
  totalSales,
  salesPerPage,
  onPageChange,
  statusFilter: externalStatusFilter,
  onFilterChange,
  onRefetch,
}: {
  sales: TokenSale[] | null;
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
  const { user: currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState(
    externalStatusFilter || DEFAULT_STATUS_TO_SHOW,
  );
  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage || 1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [enrichedSales, setEnrichedSales] = useState<TokenSale[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [isMatchBuyerModalOpen, setIsMatchBuyerModalOpen] = useState(false);
  const [matchableSales, setMatchableSales] = useState<TokenSale[]>([]);
  const [selectedMatchedSaleId, setSelectedMatchedSaleId] = useState<string>('');
  const [isLoadingMatchableSales, setIsLoadingMatchableSales] = useState(false);
  const [isMatchBuyerSuccess, setIsMatchBuyerSuccess] = useState(false);
  const isAdmin = currentUser?.roles.includes('admin');
  const isSpaceHost = currentUser?.roles?.includes('space-host');

  const [isMintSweatModalOpen, setIsMintSweatModalOpen] = useState(false);

  // Fetch complete user data including private fields for admin users
  useEffect(() => {
    const fetchEnrichedSales = async () => {
      if (!sales || !isAdmin) {
        setEnrichedSales(sales || []);
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

        // Fetch users with private fields (admin only)
        const buyersRes = await api.get(
          `/user?where=${encodeURIComponent(
            JSON.stringify({ _id: { $in: uniqueBuyerIds } }),
          )}&includePrivate=true`,
        );
        const buyers = buyersRes.data.results as BuyerRecord[];
        setEnrichedSales(enrichSalesWithBuyers(salesArray, buyers));
      } catch (error) {
        console.error('Error fetching enriched sales data:', error);
        setEnrichedSales(sales);
      }
    };

    fetchEnrichedSales();
  }, [sales, isAdmin]);

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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string }> = {
      'pending-payment': { variant: 'secondary', label: 'Pending Payment' },
      completed: { variant: 'default', label: 'Completed' },
      paid: { variant: 'secondary', label: 'Paid' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      matched: { variant: 'warning', label: 'Matched' },
    };

    const config = statusConfig[status] || {
      variant: 'secondary',
      label: status,
    };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const handleDistributeTokens = (saleId: string) => {
    setSelectedSaleId(saleId);
    setTransactionId('');
    setIsModalOpen(true);
  };

  const fetchMatchableSales = async () => {
    setIsLoadingMatchableSales(true);
    try {
      const where = { status: { $in: ['pending-payment', 'cancelled'] as const } };
      const res = await api.get('/sale', {
        params: { where: formatSearch(where), limit: 500 },
      });
      const rawSales = res.data?.results ?? [];
      const salesArray = Array.isArray(rawSales)
        ? rawSales
        : (rawSales as { toJS?: () => TokenSale[] }).toJS
        ? (rawSales as { toJS: () => TokenSale[] }).toJS()
        : rawSales;
      const uniqueBuyerIds = [
        ...new Set(
          (salesArray as TokenSale[]).map((s) => s.createdBy).filter(Boolean),
        ),
      ] as string[];
      if (uniqueBuyerIds.length === 0) {
        setMatchableSales(salesArray as TokenSale[]);
        setIsLoadingMatchableSales(false);
        return;
      }
      const buyersRes = await api.get(
        `/user?where=${encodeURIComponent(JSON.stringify({ _id: { $in: uniqueBuyerIds } }))}&includePrivate=true`,
      );
      const buyers = (buyersRes.data?.results ?? []) as BuyerRecord[];
      setMatchableSales(
        enrichSalesWithBuyers(salesArray as TokenSale[], buyers) as TokenSale[],
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
  };

  const handleSubmitTransaction = async () => {
    setIsSuccess(false);
    if (!transactionId.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/token-distribution-confirmation', {
        saleId: selectedSaleId,
        txHash: transactionId,
        buyerEmail: enrichedSales?.find(
          (sale: TokenSale) => sale._id === selectedSaleId,
        )?.buyer?.email,
        numTokens: enrichedSales?.find(
          (sale: TokenSale) => sale._id === selectedSaleId,
        )?.quantity,
        buyerName: enrichedSales?.find(
          (sale: TokenSale) => sale._id === selectedSaleId,
        )?.buyer?.screenname,
      });
      if (res.status === 200) {
        setIsSuccess(true);
        onSuccess?.();
      } else {
        setIsSuccess(false);
      }
    } catch (error) {
      console.error(
        'Error submitting  token distribution confirmation:',
        error,
      );
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
      const matchedSale = matchableSales.find((s) => s._id === selectedMatchedSaleId);
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return formatIsoFiatAmount(price, 'USD');
  };

  const paidSalesWithWallet = enrichedSales.filter(
    (sale) =>
      sale.status === 'paid' &&
      sale.buyer?.walletAddress &&
      sale.quantity,
  );

  const handleCreateBatchSafeTx = () => {
    const { address: tokenAddress, symbol: tokenSymbol, decimals: tokenDecimals } =
      blockchainConfig.BLOCKCHAIN_DAO_TOKEN;
    const chainId = String(blockchainConfig.BLOCKCHAIN_NETWORK_ID);

    const transactions = paidSalesWithWallet.map((sale) => {
      const amountSmallestUnit = parseTokenUnits(sale.quantity!, tokenDecimals);
      return {
        to: tokenAddress,
        value: '0',
        data: null,
        contractMethod: {
          inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
          ],
          name: 'mint',
          payable: false,
        },
        contractInputsValues: {
          to: sale.buyer!.walletAddress,
          amount: amountSmallestUnit.toString(),
        },
      };
    });

    const batchJson = {
      version: '1.0',
      chainId,
      createdAt: Date.now(),
      meta: {
        name: `${tokenSymbol} Token Mint Batch`,
        description: `Mint $${tokenSymbol} tokens to ${transactions.length} member addresses`,
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
    link.download = `batch-safe-tx-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            {isSpaceHost && (
              <Button
                size="small"
                onClick={() => setIsMintSweatModalOpen(true)}
                className="text-xs rounded-full text-background py-1 h-fit"
              >
                {t('token_sales_dashboard_mint_sweat_button')}
              </Button>
            )}
            {statusFilter === 'paid' && isAdmin && paidSalesWithWallet.length > 0 && (
              <Button
                size="small"
                onClick={handleCreateBatchSafeTx}
                className="text-xs rounded-full text-background py-1 h-fit"
              >
                {t('token_sales_dashboard_create_batch_safe_tx')}
              </Button>
            )}
            <span className="text-sm">{t('token_sales_dashboard_select_status')}</span>
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
        {/* Mobile card layout */}
        <div className="md:hidden space-y-3">
          {currentSales.map((sale: TokenSale) => (
            <div
              key={sale._id}
              className={`${
                sale.buyer ? '' : 'bg-yellow-100'
              } border border-border rounded-lg p-4 space-y-3`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium">{sale.name}</div>
                {getStatusBadge(sale.status)}
              </div>
              <div>
                {sale.buyer ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/members/${sale.buyer._id}`}
                      className="bg-accent text-background px-2 py-0.5 rounded-full w-fit text-sm"
                    >
                      {sale.buyer.screenname}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {isAdmin && sale.buyer.email
                        ? sale.buyer.email
                        : t('token_sales_dashboard_no_email_provided')}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono break-all">
                      {isAdmin && sale.buyer.walletAddress
                        ? sale.buyer.walletAddress
                        : t('token_sales_dashboard_no_wallet_address')}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">
                    {t('token_sales_dashboard_unknown_buyer')}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">{t('token_sales_dashboard_quantity')}: </span>
                  {sale.createdBy ? (sale.quantity ?? 0) : 'N/A'}
                </div>
                <div className="font-mono">
                  {formatPrice(sale.total_price)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDate(sale.created)}
                </span>
                <div className="flex gap-2">
                  {sale.status !== 'matched' &&
                    sale.status === 'paid' &&
                    sale.product_type === 'token' &&
                    sale?.buyer && (
                      <Button
                        size="small"
                        onClick={() => handleDistributeTokens(sale._id)}
                        className="text-xs w-fit rounded-full text-background py-1 h-fit"
                      >
                        {t('token_sales_dashboard_distribute_tokens')}
                      </Button>
                    )}
                  {sale.status !== 'matched' && !sale?.buyer && (
                    <Button
                      size="small"
                      onClick={() => handleShowMatchBuyerModal(sale._id)}
                      className="text-xs w-fit rounded-full text-background py-1 h-fit"
                    >
                      {t('token_sales_dashboard_match_buyer_manually')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
                  {t('token_sales_dashboard_buyer')}
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
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale: TokenSale) => (
                <tr
                  key={sale._id}
                  className={`${
                    sale.buyer ? '' : 'bg-yellow-100'
                  } border-b border-border hover:bg-muted/50`}
                >
                  <td className="p-4 font-medium align-top">
                    <div>{sale.name}</div>
                  </td>
                  <td className="p-4 align-top">
                    {sale.buyer ? (
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">
                          <Link
                            href={`/members/${sale.buyer._id}`}
                            className="bg-accent text-background px-2 py-0.5 rounded-full"
                          >
                            {sale.buyer.screenname}
                          </Link>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isAdmin && sale.buyer.email
                            ? sale.buyer.email
                            : t('token_sales_dashboard_no_email_provided')}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {isAdmin && sale.buyer.walletAddress
                            ? sale.buyer.walletAddress
                            : t('token_sales_dashboard_no_wallet_address')}
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        {t('token_sales_dashboard_unknown_buyer')}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">
                    {sale.createdBy ? (sale.quantity ?? 0) : 'N/A'}
                  </td>
                  <td className="p-4 font-mono align-top">
                    {formatPrice(sale.total_price)}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(sale.status)}
                      {sale.status !== 'matched' &&
                        sale.status === 'paid' &&
                        sale.product_type === 'token' &&
                        sale?.buyer && (
                          <Button
                            size="small"
                            onClick={() => handleDistributeTokens(sale._id)}
                            className="text-xs w-fit rounded-full text-background py-1 h-fit"
                          >
                            {t('token_sales_dashboard_distribute_tokens')}
                          </Button>
                        )}

                      {sale.status !== 'matched' && !sale?.buyer && (
                        <Button
                          size="small"
                          onClick={() => handleShowMatchBuyerModal(sale._id)}
                          className="text-xs w-fit rounded-full text-background py-1 h-fit"
                        >
                          {t('token_sales_dashboard_match_buyer_manually')}
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground align-top whitespace-nowrap">
                    {formatDate(sale.created)}
                  </td>
                </tr>
              ))}
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
                    (sale: TokenSale) => sale._id === selectedSaleId,
                  )?.buyer?.screenname
                }
              </p>
            </div>

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
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                isEnabled={!isLoading}
              >
                {t('token_sales_dashboard_cancel')}
              </Button>
              <Button
                onClick={handleSubmitTransaction}
                isEnabled={
                  Boolean(transactionId.trim()) && !isLoading && !isSuccess
                }
                isLoading={isLoading}
              >
                {isLoading
                  ? t('token_sales_dashboard_distributing')
                  : t('token_sales_dashboard_distribute_tokens_button')}
              </Button>
            </div>
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
                              {formatPrice(sale.total_price)}
                            </span>
                            {getStatusBadge(sale.status)}
                          </div>
                          <div className="text-sm truncate">
                            {sale.buyer?.email ?? '—'}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t('token_sales_dashboard_quantity')}: {sale.createdBy ? (sale.quantity ?? 0) : 'N/A'}</span>
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
                                {formatPrice(sale.total_price)}
                              </td>
                              <td className="p-2">
                                {sale.buyer?.email ?? '—'}
                              </td>
                              <td className="p-2">
                                {sale.createdBy ? (sale.quantity ?? 0) : 'N/A'}
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
                matchableSales.filter((s) => s._id !== selectedSaleId).length === 0 && (
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

export default SalesDashboard;
