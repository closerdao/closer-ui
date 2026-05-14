export type ApiOk<T> = { results: T };
export type ApiErr = { error: string };

export type MetricsKpiRow = {
  category: string;
  event: string;
  events: number;
  sumPoint: number;
  valueVariants: string[];
};

export type MetricsByCategoryRow = {
  category: string;
  rows: number;
  sumPoint: number;
  eventCount: number;
};

export type MetricsDailyTrendRow = {
  _id: { day: string; category: string; event: string };
  count: number;
  sumPoint: number;
};

export type MetricsNavigationTopRow = {
  path: string;
  views: number;
};

export type MetricsTokenSaleRow = {
  value: string | null | undefined;
  created: string;
};

export type TokenFunnelResults = {
  tokenPageViews: number;
  calculator: number;
  checkout: number;
  success: number;
  tokensSoldPointSum: number;
};

export type BookingFunnelResults = {
  availabilityChecks: number;
  pageViews: number;
  listingViews: number;
  intentOrFlow: number;
  completionSignals: number;
  categoryTotal: number;
  categoryPointSum: number;
};

export type SubscriptionsFunnelResults = {
  stripeFirstPayment: number;
  subscriptionsPageViews: number;
  subscriptionsCategoryTotal: number;
  checkoutOrSubscribe: number;
  completionSignals: number;
  engagementSubscriptionTouch: number;
  subscriptionsPointSum: number;
};

export type CitizenshipLikeFunnelResults = {
  pageViews: number;
  applicationFlow: number;
  milestones: number;
  categoryTotal: number;
  categoryPointSum: number;
};

export type SignupFunnelResults = {
  pageViews: number;
  formOrRegister: number;
  submitOrCreate: number;
  verifyOrActivate: number;
  categoryTotal: number;
  categoryPointSum: number;
};

export type FundraiserFunnelResults = {
  pageViews: number;
  donateIntent: number;
  paymentFlow: number;
  successSignals: number;
  categoryTotal: number;
  categoryPointSum: number;
};

export type MetricsDashboardBundle = {
  kpi: MetricsKpiRow[];
  byCategory: MetricsByCategoryRow[];
  dailyTrends: MetricsDailyTrendRow[];
  tokenFunnel: TokenFunnelResults;
  bookingFunnel: BookingFunnelResults;
  subscriptionsFunnel: SubscriptionsFunnelResults;
  citizenshipFunnel: CitizenshipLikeFunnelResults;
  coHousingFunnel: CitizenshipLikeFunnelResults;
  signupFunnel: SignupFunnelResults;
  fundraiserFunnel: FundraiserFunnelResults;
  navigationTop: MetricsNavigationTopRow[];
  tokenSales: MetricsTokenSaleRow[];
};
