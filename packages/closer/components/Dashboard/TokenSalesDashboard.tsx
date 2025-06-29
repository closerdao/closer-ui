import Link from 'next/link';

import { useEffect, useMemo, useState } from 'react';

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

const SalesDashboard = ({
  sales,
  onSuccess,
}: {
  sales: TokenSale[] | null;
  onSuccess?: () => void;
}) => {
  const { user: currentUser } = useAuth();
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [enrichedSales, setEnrichedSales] = useState<TokenSale[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isAdmin = currentUser?.roles.includes('admin');

  // Fetch complete user data including private fields for admin users
  useEffect(() => {
    const fetchEnrichedSales = async () => {
      if (!sales || !isAdmin) {
        setEnrichedSales(sales || []);
        return;
      }

      try {
        // Get unique buyer IDs
        const uniqueBuyerIds = [
          ...new Set(sales.map((sale: TokenSale) => sale.createdBy)),
        ];

        // Fetch users with private fields (admin only)
        const buyersRes = await api.get(
          `/user?where=${encodeURIComponent(
            JSON.stringify({ _id: { $in: uniqueBuyerIds } }),
          )}&includePrivate=true`,
        );
        const buyers = buyersRes.data.results;

        // Enrich sales with complete buyer data
        const enriched = sales.map((sale: TokenSale) => {
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

  const filteredSales = useMemo(() => {
    if (!enrichedSales || enrichedSales.length === 0) {
      return [];
    }

    if (statusFilter === 'all') {
      return enrichedSales;
    }
    return enrichedSales.filter((sale: TokenSale) => {
      return sale.status === statusFilter;
    });
  }, [statusFilter, enrichedSales]);

  // Calculate pagination
  const totalSales = filteredSales.length;
  const totalPages = Math.ceil(totalSales / SALES_PER_PAGE);
  const startIndex = (currentPage - 1) * SALES_PER_PAGE;
  const endIndex = startIndex + SALES_PER_PAGE;
  const currentSales = filteredSales.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Ensure current page is valid when total pages changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSaleId('');
    setTransactionId('');
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
              {totalSales} {statusFilter === 'all' ? 'total' : statusFilter}{' '}
              sales
            </p>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, totalSales)} of{' '}
                {totalSales} sales
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            Select status:
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending-payment">Pending Payment</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="all">All Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-medium align-top">
                  Product Name
                </th>
                <th className="text-left p-4 font-medium align-top">Buyer</th>
                <th className="text-left p-4 font-medium align-top">
                  Quantity
                </th>
                <th className="text-left p-4 font-medium align-top">Price</th>
                <th className="text-left p-4 font-medium align-top">Status</th>
                <th className="text-left p-4 font-medium align-top">Created</th>
              </tr>
            </thead>
            <tbody>
              {currentSales.map((sale: TokenSale) => (
                <tr
                  key={sale._id}
                  className="border-b border-border hover:bg-muted/50"
                >
                  <td className="p-4 font-medium align-top">
                    <div className="flex flex-col gap-1">
                      <div>{sale.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {isFiatTokenSale(sale) ? 'Fiat' : 'Crypto'}
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
                            : 'No email provided'}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {isAdmin && sale.buyer.walletAddress
                            ? sale.buyer.walletAddress
                            : 'No wallet address'}
                        </div>
                        {isAdmin && sale.buyer.email && (
                          <LinkButton
                            size="small"
                            variant="secondary"
                            className="w-fit text-xs h-fit px-2 py-0.5 rounded-full"
                            href={`mailto:${sale.buyer.email}`}
                          >
                            Send email to user
                          </LinkButton>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Unknown buyer
                      </span>
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
                        sale.product_type === 'token' && (
                          <Button
                            size="small"
                            onClick={() => handleDistributeTokens(sale._id)}
                            className="w-fit rounded-full text-background py-1 h-fit"
                          >
                            Distribute Tokens
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
            No sales found with status: {statusFilter}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              loadPage={handlePageChange}
              queryParam="page"
              total={totalSales}
              page={currentPage}
              limit={SALES_PER_PAGE}
              maxPages={5}
            />
          </div>
        )}
      </Card>

      {isModalOpen && (
        <Modal closeModal={handleCloseModal}>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Distribute Tokens</h2>
              <p className="text-muted-foreground">
                Enter the transaction ID to distribute tokens to user:{' '}
              </p>
              <p>
                {
                  sales?.find((sale: TokenSale) => sale._id === selectedSaleId)
                    ?.buyer?.screenname
                }
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="transactionId"
                className="block text-sm font-medium"
              >
                Transaction ID
              </label>
              <Input
                id="transactionId"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                isEnabled={!isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitTransaction}
                isEnabled={Boolean(transactionId.trim()) && !isLoading  && !isSuccess}
                isLoading={isLoading}
              >
                {isLoading ? 'Distributing...' : 'Distribute Tokens'}
              </Button>
            </div>
            {isSuccess && (
              <div className="text-green-500">
                Token distribution confirmation submitted successfully
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesDashboard;
