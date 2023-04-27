export interface SubscriptionPlan {
    title: string;
    available: boolean;
    emoji: string;
    description: string;
    priceId: string;
    tier: number;
    monthlyCredits: number;
    price: number;
    perks: string[];
    billingPeriod: string;
  }

  export interface Subscriptions {
    config: {
      currency: string;
      symbol: string;
    };
    plans: SubscriptionPlan[];
  }

  export interface SelectedPlan {
    title: string;
    monthlyCredits: number;
    price: number;
  }
