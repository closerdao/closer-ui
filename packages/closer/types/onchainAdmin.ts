export type TokenUserResult =
  | {
      _id: string;
      screenname: string;
      hasWallet: true;
      walletAddress: string;
    }
  | {
      _id: string;
      screenname: string;
      hasWallet: false;
      walletAddress: null;
    };

export type SafeOperation =
  | 'tdfMint'
  | 'tdfTransfer'
  | 'sweatMint'
  | 'sweatBurn';

export type SafeProposalSkipCode =
  | 'NO_WALLET'
  | 'USER_NOT_FOUND'
  | 'INVALID_WALLET'
  | 'INVALID_AMOUNT';

export interface SafeProposalSkippedRecipient {
  userId?: string;
  source?: 'recipient' | 'entries' | 'sweatEntries';
  code: SafeProposalSkipCode;
}

export interface SafeProposalSkippedSale {
  saleId: string;
  code: SafeProposalSkipCode;
  reason?: string;
}

export interface SafeProposalResult {
  safeAddress: string;
  safeTxHash: string;
  safeNonce: number;
  safeUrl: string;
  origin: string;
  alreadyExisted: boolean;
  submittedCount: number;
  skipped: SafeProposalSkippedRecipient[];
}

export type TokenDistributionStatusName =
  | 'creating'
  | 'pending'
  | 'finalizing'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'
  | 'superseded'
  | 'needs-review';

export interface TokenDistributionStatus {
  id: string;
  saleId: string;
  status: TokenDistributionStatusName | string;
  active: boolean;
  safeTxHash: string;
  safeUrl: string;
  confirmationsSubmitted: number;
  confirmationsRequired: number;
  executionTxHash: string;
  explorerUrl: string;
  lastError: string;
  entryLastError: string;
}

export interface TransactionBuilderTransaction {
  to: string;
  value: string;
  data: string | null;
  contractMethod: {
    inputs: Array<{
      internalType: string;
      name: string;
      type: string;
      components?: Array<{
        internalType: string;
        name: string;
        type: string;
      }>;
    }>;
    name: string;
    payable: boolean;
  } | null;
  contractInputsValues: Record<string, string> | null;
}
