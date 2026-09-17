import { FinanceApplication } from '../types/subscriptions';

/** The API has answered with either spelling, so both have to be recognised. */
const CANCELLED_STATUSES = ['cancelled', 'canceled'];

/**
 * Contracts that are already closed cannot be cancelled again.
 */
const NON_CANCELLABLE_STATUSES = [...CANCELLED_STATUSES, 'completed'];

export interface FinanceCancellationSummary {
  /** Everything the member has paid on this contract so far. */
  totalPaid: number;
  /** Down payment agreed on the contract — forfeited on cancellation. */
  depositAmount: number;
  isDepositPaid: boolean;
  /** Paid amount, minus the forfeited deposit, that converts into tokens. */
  amountToConvert: number;
  /** Tokens that amount buys, pro-rated over the financed part of the contract. */
  estimatedTokens: number;
}

export function isFinanceDepositPaid(
  application: FinanceApplication | null | undefined,
): boolean {
  if (!application) return false;
  if (Number(application.downPaymentAmount || 0) <= 0) return false;
  return (
    application.isDownPaymentMade === true ||
    (application.status !== 'pending-payment' &&
      application.status !== 'pending')
  );
}

export function getFinancePaidChargesTotal(
  application: FinanceApplication | null | undefined,
): number {
  return (application?.charges || [])
    .filter((charge: { status?: string }) => charge?.status === 'paid')
    .reduce(
      (total: number, charge: { amount?: { total?: { val?: number } } }) =>
        total + (charge?.amount?.total?.val || 0),
      0,
    );
}

export function isFinanceApplicationCancelled(
  application: FinanceApplication | null | undefined,
): boolean {
  if (!application) return false;
  return CANCELLED_STATUSES.includes(application.status);
}

export function canCancelFinanceApplication(
  application: FinanceApplication | null | undefined,
): boolean {
  if (!application) return false;
  return !NON_CANCELLABLE_STATUSES.includes(application.status);
}

export function getFinanceCancellationSummary(
  application: FinanceApplication | null | undefined,
): FinanceCancellationSummary {
  const totalPaid = getFinancePaidChargesTotal(application);
  const depositAmount = Number(application?.downPaymentAmount || 0);
  const isDepositPaid = isFinanceDepositPaid(application);
  // The deposit is one of the paid charges, so it has to come off the total
  // before the rest can be converted — but never more than what was paid.
  const forfeitedDeposit = isDepositPaid
    ? Math.min(depositAmount, totalPaid)
    : 0;
  const amountToConvert = Math.max(totalPaid - forfeitedDeposit, 0);

  const contractFiat = Number(application?.totalToPayInFiat || 0);
  const contractTokens = Number(application?.tokensToFinance || 0);
  const financedFiat = Math.max(contractFiat - depositAmount, 0);
  const estimatedTokens =
    financedFiat > 0 && contractTokens > 0
      ? Number(
          (
            (Math.min(amountToConvert, financedFiat) / financedFiat) *
            contractTokens
          ).toFixed(6),
        )
      : 0;

  return {
    totalPaid,
    depositAmount,
    isDepositPaid,
    amountToConvert,
    estimatedTokens,
  };
}
