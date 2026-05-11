export interface SubscriptionVariant {
  title: string;
  monthlyCredits: number;
  price: number;
  priceId: string;
}

export interface Tier {
  unitPrice: number;
  minAmount: number;
  maxAmount: number;
}

export interface SubscriptionPlan {
  slug: string;
  title: string;
  emoji?: string;
  description: string;
  priceId: string;
  tier: number;
  monthlyCredits?: number;
  price: number;
  available: boolean;
  tiersAvailable: boolean;
  perks: string;
  billingPeriod: string;
  tiers?: string;
  variants?: SubscriptionVariant;
  note?: string;
}

export interface Tier {
  unitPrice: number;
  minAmount: number;
  maxAmount: number;
}

export interface Subscriptions {
  config: {
    currency: string;
    symbol: string;
  };
  elements: SubscriptionPlan[];
}

export interface SelectedPlan {
  title: string;
  monthlyCredits: number;
  price: number;
  tiersAvailable: boolean;
  variants?: SubscriptionVariant[];
  tiers?: Tier[];
}

export interface Review {
  name: string;
  rating: number;
  text: string;
  photo: string;
}

export interface FinanceApplication {
  _id: string;
  userId: string;
  status:
    | 'pending-payment'
    | 'paid'
    | 'cancelled'
    | 'completed'
    | 'pending'
    | 'delinquent'
    | 'up-to-date';
  memoCode?: string;
  iban: string;
  tokensToFinance: number;
  totalToPayInFiat: number;
  monthlyPaymentAmount: number;
  downPaymentAmount: number;
  charges: any[];
  isCitizenApplication?: boolean;
  durationInMonths?: number;
  isDownPaymentMade?: boolean;
  isAnnualCreditsAwarded?: boolean;
  paymentsScheduled?: Record<
    string,
    {
      status: 'pending' | 'paid';
      amountPaid: number;
      paymentDate: string | Date;
    }
  >;
  tokensAccrued?: number;
  tokensDistributed?: number;
  tokenDistributions?: Array<{
    amount: number;
    date: string | Date;
    createdBy: string;
    txHash: string;
  }>;
  visibility: 'public' | 'private';
  visibleBy: string[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: any[];
  managedBy: string[];
}

export interface FinanceApplicationCreateRequest {
  tokensToFinance: number;
  totalToPayInFiat: number;
  iban: string;
  isCitizenApplication: boolean;
  why?: string;
}

export interface FinanceApplicationResponse {
  results: FinanceApplication[];
  count?: number;
}
