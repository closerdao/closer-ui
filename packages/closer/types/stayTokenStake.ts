export type PendingStayTokenStake = {
  transactionId: string;
  nightsKey: string;
  completedNightCount: number;
};

export type StayTokenStakeProgressPhase =
  | 'idle'
  | 'preparing'
  | 'awaiting-wallet'
  | 'confirming';

export type StayTokenStakeProgress = {
  completedNights: number;
  totalNights: number;
  requiresMultipleTransactions: boolean;
  phase: StayTokenStakeProgressPhase;
};

export type StayTokenStakeProgressUpdate = {
  completedNightCount: number;
  transactionId: string | null;
};

export type StayTokenStakeOptions = {
  completedNightCount?: number;
  onProgress?: (progress: StayTokenStakeProgressUpdate) => void | Promise<void>;
};
