import { User } from 'closer/contexts/auth/types';

import type { AccountingEntityProductSlug } from '../constants/accountingEntities.constants';
import { CloserCurrencies, Price } from './currency';

export type FileUploadResult = {
  _id: string;
  slug: string;
  url: string;
  filename: string;
  extension: string;
  contentType: string;
  size: number;
  createdBy: string;
  visibility: string;
  created: string;
  updated: string;
};

export type BookingConditions = {
  minDuration: number | undefined;
  maxDuration: number | undefined;
  maxBookingHorizon: number | undefined;
  memberMinDuration: number | undefined;
  memberMaxDuration: number | undefined;
  memberMaxBookingHorizon: number | undefined;
};

export type VolunteerOpportunity = {
  name: string;
  category: string;
  photo: string;
  slug: string;
  description: string;
  start: string;
  end: string;
  /** Drives bookingType: residence when true, volunteer otherwise. */
  residency?: boolean;
  visibleBy: any[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: any[];
  managedBy: any[];
  _id: string;
};

export type Role = {
  title: string;
  description: string;
  compensation: string;
  hoursPerWeek: number;
  skillsRequired: string[];
  responsibilities: string[];
  visibleBy: any[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: any[];
  managedBy: any[];
  _id: string;
};

export type Project = VolunteerOpportunity & {
  budget?: number;
  documentUrl?: string;
  reward?: Price<CloserCurrencies>;
  skills?: string[];
  estimate?: string;
  manager?: User;
  descriptionText?: string;
  status?: 'open' | 'in-progress' | 'done';
};

export type Question = {
  type: 'text' | 'select';
  name: string;
  required?: boolean;
  options?: string[];
};

export type QuestionnaireItemHandle = {
  flush: () => { name: string; value: string };
};

export type BookingSettings = {
  utilityFiatVal: number;
  utilityFiatCur: CloserCurrencies;
  utilityDayFiatVal: number;
  utilityTokenVal: number;
  utilityTokenCur: CloserCurrencies;
  checkinTime: number;
  checkoutTime: number;
  maxDuration: number;
  minDuration: number;
  maxBookingHorizon: number;
  volunteerCommitment: string;
  memberMinDuration: number;
  memberMaxDuration: number;
  memberMaxBookingHorizon: number;
  discountsDaily: number;
  discountsWeekly: number;
  discountsMonthly: number;
  seasonsHighStart: string;
  seasonsHighEnd: string;
  seasonsHighModifier: number;
  cancellationPolicyLastday: number;
  cancellationPolicyLastweek: number;
  cancellationPolicyLastmonth: number;
  cancellationPolicyDefault: number;
  pickUpEnabled: boolean;
  foodOptionEnabled: boolean;
  utilityOptionEnabled: boolean;
  friendsBookingMaxGuests?: number;
};

export interface Config {
  slug: string;
  value: {
    [key: string]: string | number | boolean | string[];
  };
}

export type BookingRule = {
  title: string;
  description: string;
};

export interface BookingRulesConfig {
  enabled: boolean;
  elements: BookingRule[];
}

export type GeneralConfig = {
  enabled: boolean;
  country?: string;
  appName: string;
  platformName: string;
  semanticUrl: string;
  platformLegalAddress: string;
  teamEmail: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  locationLat: string;
  locationLon: string;
  visitorsGuide: string;
  facebookPixelId: string;
  faqsGoogleSheetId: string;
  timeZone: string;
  minVouchingStayDuration?: number;
  expenseCategories?: string;
  discordUrl: string;
  telegramUrl: string;
  primaryCtaVisitor?: string;
  primaryCtaMember?: string;
  primaryCtaCustomUrl?: string;
  primaryCtaCustomText?: string;
};
export type ApplicationFieldType =
  | 'text'
  | 'longtext'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'date'
  | 'select'
  | 'country';

export type ApplicationField = {
  /** Key the answer is stored under, e.g. `communitySize`. */
  name: string;
  label: string;
  type: ApplicationFieldType;
  /** Comma separated choices, only used by `select` fields. */
  options?: string;
  placeholder?: string;
  required?: boolean;
};

export type ApplicationsConfig = {
  enabled: boolean;
  ctaText?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  submitButtonText?: string;
  disclaimer?: string;
  successTitle?: string;
  successMessage?: string;
  fields?: ApplicationField[];
};

export type CitizenshipConfig = {
  enabled: boolean;
  isSpaceHostVouchRequired: boolean;
  minVouches: number;
  minVouchingStayDuration: number;
  tokensRequired: number;
};

export type AffiliateConfig = {
  enabled: boolean;
  tokenSaleCommissionPercent: number;
  financedTokenSaleCommissionPercent: number;
  subscriptionCommissionPercent: number;
  staysCommissionPercent: number;
  eventsCommissionPercent: number;
  productsCommissionPercent: number;
};

export type EngagementConfig = {
  enabled: boolean;
  ctaLink?: string;
  ctaText?: string;
};

export type BookingConfig = {
  enabled: boolean;
  minDuration: number;
  maxDuration: number;
  maxBookingHorizon: number;
  memberMinDuration: number;
  memberMaxDuration: number;
  memberMaxBookingHorizon: number;
  discountsDaily: number;
  seasonsHighModifier: number;
  seasonsHighEnd: string;
  cancellationPolicyDefault: number;
  seasonsHighStart: string;
  cancellationPolicyLastday: number;
  checkoutTime: number;
  discountsWeekly: number;
  utilityTokenCur: string;
  utilityTokenVal: number;
  cancellationPolicyLastmonth: number;
  checkinTime: number;
  discountsMonthly: number;
  utilityDayFiatVal: number;
  utilityFiatCur: string;
  volunteerCommitment: string;
  cancellationPolicyLastweek: number;
  utilityFiatVal: number;
  pickUpEnabled: boolean;
  foodOptionEnabled: boolean;
  utilityOptionEnabled: boolean;
  foodPriceBasic: number;
  foodPriceChef: number;
  chatLink: string;
  friendsBookingMaxGuests: number;
};

export type PaymentConfig = {
  enabled: boolean;
  cardPayment: string;
  cryptoPayment: string;
  ethereumWalletAddress: string;
  polygonWalletAddress: string;
  vatRate: number;
};

export type TokenConfig = {
  enabled: boolean;
  reserveToken?: string;
  gasToken?: string;
  bookingToken?: string;
  maxSupply?: number | string;
  downPaymentPercent?: number;
  /**
   * @deprecated Financed carrying cost is `financingAprPercent`. Kept optional
   * so legacy stored documents still type-check; ignored by the finance quote.
   */
  tokenPriceModifierPercent?: number;
  /** Hard ceiling on repayment length in months (e.g. 6, 180, 360). */
  maxFinancingMonths?: number;
  /** Carrying APR (% per annum) applied to the financed principal. */
  financingAprPercent?: number;
  /** Minimum allowed monthly installment in fiat. */
  minMonthlyPayment?: number;
  /** Optional comma separated preset months, e.g. `'12,24,36'`. */
  financingDurationsMonths?: string;
};

export type VolunteerConfig = {
  enabled: boolean;
  volunteeringMinStay: number;
  residenceMinStay: number;
  skills?: string;
  residenceTimeFrame?: string;
  diet?: string;
};

export type CohousingConfig = {
  enabled: boolean;
};

export type MilestoneStatus = 'pending' | 'active' | 'completed';

export type FundraisingMilestone = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  items?: string;
  goal?: number;
  targetAmount?: number;
  start?: string;
  end?: string;
  startDate?: string | null;
  endDate?: string | null;
  currency?: string;
  ctaUrl?: string;
};

export type FundraisingPackageType =
  | 'tokens'
  | 'loan'
  | 'credits'
  | 'subscribe';

export type FundraisingPackage = {
  type: FundraisingPackageType;
  title: string;
  description?: string;
  tokens?: number;
  bonus?: string;
  minAmount?: string;
  credits?: number;
  subscribeUrl?: string;
  ctaUrl?: string;
};

export type FundraisingManualAdjustment = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  countsTowardMilestone: string;
};

export type FundraisingConfig = {
  enabled: boolean;
  amountRaisedPreCampaign?: number;
  loansCollectedTotal?: number;
  campaignVideo?: string;
  campaignTitle?: string;
  creditPricePerUnit?: number;
  adjustmentsLabel?: string;
  milestones?: FundraisingMilestone[];
  packages?: FundraisingPackage[];
};

export type InvestPageOptions = {
  canonicalUrl?: string;
  shareUrl?: string;
  ogImageUrl?: string;
  twitterHandle?: string;
  dataroomHref?: string;
  scheduleCallHref?: string;
  loanPackageHref?: string;
  subscriptionHref?: string;
  donationHref?: string;
};

export type AccountingEntityElement = {
  _id?: string;
  legalName: string;
  taxNumber?: string;
  address?: string;
  accountingDescription?: string;
  products?: string[];
  iban?: string;
  bic?: string;
};

export type AccountingEntitiesConfig = {
  enabled?: boolean;
  elements?: AccountingEntityElement[];
  vatByProductType?: Partial<Record<AccountingEntityProductSlug, number>>;
};

export type SaleInitPaymentMethod = 'bank' | 'card' | 'crypto';

export type SaleInitBody = {
  type: string;
  total_price?: number;
  token_price?: number;
  quantity?: number;
  productId?: string;
  paymentMethod?: SaleInitPaymentMethod;
  entity?: string;
  name?: string;
  email?: string;
  message?: string;
};

export type SaleChargeMeta = {
  senderName?: string;
  userEmail?: string;
  userName?: string;
  productType?: string;
  memoCode?: string;
  [key: string]: unknown;
};

export type SaleCharge = {
  _id?: string;
  type?: string;
  method?: string;
  status?: string;
  amount?: {
    total?: {
      val?: number;
      cur?: string;
    };
  };
  meta?: SaleChargeMeta;
};

export type SaleMeta = {
  userName?: string;
  normalizedSenderIban?: string;
  [key: string]: unknown;
};

// A charge row as returned by GET /charge for a given saleId - the sale's
// payment trail, which is what an admin checks the sale against.
export type SaleChargeRecord = {
  _id: string;
  id?: string;
  type?: string;
  method?: string;
  status?: string;
  date?: string;
  created?: string;
  entity?: string;
  amount?: {
    total?: { val?: number; cur?: string };
  };
  taxAmount?: { val?: number; cur?: string };
  platformRevenue?: { val?: number; cur?: string };
  netRevenue?: { val?: number; cur?: string };
  meta?: SaleChargeMeta;
};

// Billing snapshot stored on the sale when it was created - private, so only
// admins and stewards get it back from the API.
export type SaleKyc = {
  userName?: string;
  email?: string;
  legalName?: string;
  TIN?: string;
  address1?: string;
  address2?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  countryCode?: string;
  country?: string;
  kycStatus?: string;
  walletAddress?: string;
  recordedAt?: string;
};

export type SaleBuyer = {
  email: string;
  screenname: string;
  walletAddress: string;
  _id: string;
};

export type SaleStatus =
  | 'pending-payment'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'matched';

export type Sale = {
  name: string;
  total_price: number;
  price?: number;
  currency?: string;
  email?: string;
  message?: string;
  product_type: string;
  quantity?: number;
  entity?: string;
  memoCode?: string;
  paymentMethod?: 'bank' | 'card' | 'crypto' | 'cash' | 'third-party' | 'other';
  charge?: SaleCharge;
  chargeId?: string;
  charges?: string[];
  tx_hash?: string;
  meta?: SaleMeta;
  kyc?: SaleKyc;
  visibility: 'public' | 'private';
  visibleBy: string[];
  createdBy?: string;
  updated: string;
  created: string;
  attributes: unknown[];
  managedBy: string[];
  _id: string;
  status: SaleStatus;
  buyer?: SaleBuyer | null;
};

export type TokenSale = Sale & {
  product_type: 'token';
  createdBy: string;
};
