import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { TokenSale } from '../../types/api';
import api from '../../utils/api';
import Modal from '../Modal';
import Pagination from '../Pagination';
import { Input, LinkButton } from '../ui/';
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
  const [buyerEmail, setBuyerEmail] = useState('');
  const [isMatchBuyerSuccess, setIsMatchBuyerSuccess] = useState(false);
  const isAdmin = currentUser?.roles.includes('admin');

  // Fetch complete user data including private fields for admin users
  useEffect(() => {
    const fetchEnrichedSales = async () => {
      if (!sales || !isAdmin) {
        setEnrichedSales(sales || []);
        return;
      }

      try {
        // Convert platform data to plain objects if needed
        const salesArray = Array.isArray(sales)
          ? sales
          : (sales as any).toJS
          ? (sales as any).toJS()
          : sales;

        // Check if we already have enriched data for this length
        const currentLength = salesArray.length;
        if (
          enrichedSales.length === currentLength &&
          enrichedSales.length > 0
        ) {
          return;
        }

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
        const buyers = buyersRes.data.results;

        // Enrich sales with complete buyer data
        const enriched = salesArray.map((sale: any) => {
          const buyer = buyers.find(
            (buyer: any) => buyer._id === sale.createdBy,
          );

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

        setEnrichedSales(enriched);
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

  const handleShowMatchBuyerModal = (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsMatchBuyerModalOpen(true);
  };

  const handleCloseMatchBuyerModal = () => {
    setIsMatchBuyerModalOpen(false);
    setSelectedSaleId('');
    setBuyerEmail('');
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

  const handleMatchBuyer = async () => {
    setIsLoading(true);
    try {
      const res = await api.post('/sale/buyer-match', {
        saleId: selectedSaleId,
        buyerEmail: buyerEmail,
      });
      console.log('Buyer match response:', res);
      setIsMatchBuyerSuccess(true);
      // Trigger refetch to update the sales list
      if (onRefetch) {
        console.log('Calling onRefetch...');
        onRefetch();
      } else {
        console.log('onRefetch is not defined');
      }
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const isFiatTokenSale = (sale: TokenSale): boolean => {
    return sale.product_type === 'token' && !!sale.meta?.normalizedSenderIban;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-background">
        <div className="flex items-center justify-between">
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
          <div className="flex items-center gap-2">
            {t('token_sales_dashboard_select_status')}
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-48">
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
        <div className="overflow-x-auto">
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
                    <div className="flex flex-col gap-1">
                      <div>{sale.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isFiatTokenSale(sale)
                          ? t('token_sales_dashboard_fiat')
                          : t('token_sales_dashboard_crypto')}
                      </div>
                    </div>
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
                        {isAdmin && sale.buyer.email && (
                          <LinkButton
                            size="small"
                            variant="secondary"
                            className="w-fit text-xs h-fit px-2 py-0.5 rounded-full"
                            href={`mailto:${sale.buyer.email}`}
                          >
                            {t('token_sales_dashboard_send_email_to_user')}
                          </LinkButton>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-muted-foreground font-bold">
                          Untrackable order
                        </div>
                        <div className="text-sm">
                          IBAN sender name:{' '}
                          {sale.meta?.senderName || 'Unknown sender'}
                        </div>
                        <div className="text-sm">
                          Sender IBAN:{' '}
                          {sale.meta?.normalizedSenderIban || 'N/A'}
                        </div>
                        <div className="text-sm">
                          Sender memo: {sale.meta?.memoCode || 'N/A'}
                        </div>
                        <div className="text-sm">
                          Monerium order ID:{' '}
                          {sale.meta?.moneriumOrderId || 'N/A'}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top">{sale.quantity || 0}</td>
                  <td className="p-4 font-mono align-top">
                    {formatPrice(sale.total_price)}
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(sale.status)}
                      {sale.status === 'paid' &&
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

                      {!sale?.buyer && (
                        <Button
                          size="small"
                          onClick={() => handleShowMatchBuyerModal(sale._id)}
                          className="text-xs w-fit rounded-full text-background py-1 h-fit"
                        >
                          Match buyer manually
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
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                {t('token_sales_dashboard_distribute_tokens_modal_title')}
              </h2>
              <p className="text-muted-foreground">
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

            <div className="flex justify-end gap-3">
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
      {isMatchBuyerModalOpen && (
        <Modal closeModal={handleCloseMatchBuyerModal}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                Match buyer manually
              </h2>
              <p className="text-muted-foreground">
                Please enter the email of the buyer you want to match to this
                order.
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
              <label htmlFor="buyerEmail" className="block text-sm font-medium">
                Buyer email
              </label>
              <Input
                id="buyerEmail"
                type="text"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder={'Enter buyer email'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

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
                  Boolean(buyerEmail.trim()) &&
                  !isLoading &&
                  !isMatchBuyerSuccess
                }
                isLoading={isLoading}
              >
                {isLoading ? 'Matching buyer...' : 'Match buyer'}
              </Button>
            </div>
            {isMatchBuyerSuccess && (
              <div className="text-green-500">Buyer matched successfully</div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesDashboard;
