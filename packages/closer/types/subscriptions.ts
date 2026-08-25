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
  productId?: string;
  tier: number;
  monthlyCredits?: number;
  price: number;
  available: boolean;
  tiersAvailable: boolean;
  perks: string;
  billingPeriod: string;
  firstMonthFree?: boolean;
  couponId?: string;
  tiers?: string;
  variants?: SubscriptionVariant;
  note?: string;
  /** Shown next to the member's avatar. Falls back to `emoji` when empty. */
  badge?: string;
}

export interface SubscriptionsConfig {
  enabled: boolean;
  elements: SubscriptionPlan[];
  /** Whether member badges are rendered next to avatars. Defaults to on. */
  showBadges?: boolean;
  /** Page the member lands on after subscribing, e.g. /village/launch. Empty means /subscriptions/success. */
  successPage?: string;
}

export interface Subscriptions {
  enabled: boolean;
  elements: SubscriptionPlan[];
  config?: {
    currency: string;
    symbol: string;
  };
}

export interface SubscriptionPlanSyncInput {
  slug: string;
  title: string;
  emoji?: string;
  description: string;
  priceId?: string;
  productId?: string;
  tier: number;
  monthlyCredits?: number;
  price: number;
  available: boolean;
  tiersAvailable: boolean;
  perks: string;
  billingPeriod: string;
  firstMonthFree?: boolean;
  couponId?: string;
}

export interface SubscriptionPlansSyncRequest {
  elements: SubscriptionPlanSyncInput[];
  currency: string;
}

export interface SubscriptionPlansSyncResponse {
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
    // The API has answered with either spelling.
    | 'canceled'
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
  /** APR locked into the contract when it was written. */
  aprPercent?: number;
  /** Pricing inputs and derived figures stamped at contract creation. */
  pricingContext?: {
    /** Deposit plus every installment, carrying cost included. */
    totalRepayable?: number;
    carryingCost?: number;
    principal?: number;
    aprPercent?: number;
    durationInMonths?: number;
    [key: string]: unknown;
  };
  charges: any[];
  isCitizenApplication?: boolean;
  durationInMonths?: number;
  isDownPaymentMade?: boolean;
  isAnnualCreditsAwarded?: boolean;
  paymentsScheduled?: Record<
    string,
    {
      status: 'pending' | 'paid';
      /** Monthly due written at contract creation time. */
      amountDue?: number;
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
  /** Repayment term, capped by the `token` config's max financing length. */
  durationInMonths?: number;
  /** Monthly installment locked in when the contract is written. */
  monthlyPaymentAmount?: number;
  downPaymentAmount?: number;
  aprPercent?: number;
  isCitizenApplication: boolean;
  why?: string;
}

export interface FinanceApplicationResponse {
  results: FinanceApplication[];
  count?: number;
}

export interface CitizenTokenIntent {
  iWantToApply: boolean;
  iWantToBuyTokens: boolean;
  iWantToFinanceTokens: boolean;
}

export interface CitizenApplication {
  ownsRequiredTokens: boolean;
  why: string;
  hasSelectedTokenIntent: boolean;
  intent: CitizenTokenIntent;
}
