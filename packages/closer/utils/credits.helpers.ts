import type {
  CreditConfig,
  CreditPackage,
  CreditVolumeDiscount,
  FundraisingConfig,
} from '../types/api';

/** Fallback price when neither config carries one. */
export const DEFAULT_CREDIT_PRICE_PER_UNIT = 30;

export const DEFAULT_MIN_CREDIT_PURCHASE = 1;
export const DEFAULT_MAX_CREDIT_PURCHASE = 100;

const toPositiveNumber = (value: unknown): number | null => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

/**
 * What one credit costs, in the platform's fiat currency.
 *
 * `config.credit` wins, but only once an admin has actually saved a price
 * there — the merged config view synthesizes the schema default for every
 * village, so reading it blindly would silently re-price the villages that
 * configured `fundraiser.creditPricePerUnit` back when that was the only
 * place to set it. Pass `savedCreditConfig` (from `getSavedConfig('credit')`)
 * to tell "saved 30" apart from "never touched it".
 */
export const getCreditPricePerUnit = (
  creditConfig?: CreditConfig | null,
  fundraisingConfig?: FundraisingConfig | null,
  savedCreditConfig?: Record<string, unknown> | null,
): number => {
  const isPriceSaved =
    savedCreditConfig === undefined ||
    (savedCreditConfig != null &&
      savedCreditConfig.creditPricePerUnit != null &&
      savedCreditConfig.creditPricePerUnit !== '');

  if (isPriceSaved) {
    const configured = toPositiveNumber(creditConfig?.creditPricePerUnit);
    if (configured) return configured;
  }

  const legacy = toPositiveNumber(fundraisingConfig?.creditPricePerUnit);
  if (legacy) return legacy;

  return DEFAULT_CREDIT_PRICE_PER_UNIT;
};

/**
 * Whether credits can be bought at all: the build has to allow it and the
 * village has to have switched a selling surface on. `fundraiser.enabled`
 * counts because that is what gated the checkout before `config.credit`
 * existed, and the campaign packages still link to it.
 */
export const isCreditPurchaseEnabled = ({
  creditConfig,
  fundraisingConfig,
  isFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_CARROTS === 'true',
}: {
  creditConfig?: CreditConfig | null;
  fundraisingConfig?: FundraisingConfig | null;
  isFeatureEnabled?: boolean;
}): boolean =>
  Boolean(
    isFeatureEnabled &&
      (creditConfig?.enabled || fundraisingConfig?.enabled),
  );

export const getCreditPurchaseLimits = (
  creditConfig?: CreditConfig | null,
): { min: number; max: number } => {
  const min =
    toPositiveNumber(creditConfig?.minPurchase) ?? DEFAULT_MIN_CREDIT_PURCHASE;
  const max =
    toPositiveNumber(creditConfig?.maxPurchase) ?? DEFAULT_MAX_CREDIT_PURCHASE;

  // A max below the min would leave the stepper with nothing to offer.
  return { min, max: Math.max(min, max) };
};

export const clampCreditAmount = (
  amount: number,
  limits: { min: number; max: number },
): number => {
  if (!Number.isFinite(amount)) return limits.min;
  return Math.min(limits.max, Math.max(limits.min, Math.floor(amount)));
};

/** Reads `?amount=` off the checkout URL, tolerating arrays and junk. */
export const parseCreditAmountFromQuery = (
  amount: string | string[] | undefined,
  limits: { min: number; max: number },
): number => {
  const raw = Array.isArray(amount) ? amount[0] : amount;
  const parsed = parseInt(String(raw ?? ''), 10);
  return clampCreditAmount(parsed, limits);
};

export type ResolvedVolumeDiscount = {
  minCredits: number;
  discountPercent: number;
};

/**
 * The tiers a village configured, cleaned up and ordered smallest-first.
 * A percentage outside 0-100 is dropped rather than clamped: it means the
 * admin typed something they did not mean, and guessing at a discount is
 * worse than charging full price.
 */
export const getVolumeDiscounts = (
  creditConfig?: CreditConfig | null,
): ResolvedVolumeDiscount[] =>
  (creditConfig?.volumeDiscounts ?? [])
    .map((tier: CreditVolumeDiscount) => {
      const minCredits = toPositiveNumber(tier?.minCredits);
      const discountPercent = Number(tier?.discountPercent);
      if (
        !minCredits ||
        !Number.isFinite(discountPercent) ||
        discountPercent <= 0 ||
        discountPercent >= 100
      ) {
        return null;
      }
      return { minCredits, discountPercent };
    })
    .filter((tier): tier is ResolvedVolumeDiscount => tier !== null)
    .sort((a, b) => a.minCredits - b.minCredits);

/** The single best tier a quantity reaches. Tiers do not stack. */
export const getVolumeDiscountForAmount = (
  tiers: ResolvedVolumeDiscount[],
  credits: number,
): ResolvedVolumeDiscount | null =>
  tiers.reduce<ResolvedVolumeDiscount | null>(
    (best, tier) =>
      credits >= tier.minCredits &&
      (best === null || tier.discountPercent > best.discountPercent)
        ? tier
        : best,
    null,
  );

export type CreditPurchasePrice = {
  /** Credits x unit price, before any volume tier. */
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/** What a quantity actually costs, volume tier included. */
export const getCreditPurchasePrice = (
  credits: number,
  pricePerUnit: number,
  tiers: ResolvedVolumeDiscount[] = [],
): CreditPurchasePrice => {
  const subtotal = roundMoney(credits * pricePerUnit);
  const tier = getVolumeDiscountForAmount(tiers, credits);
  if (!tier) {
    return { subtotal, discountPercent: 0, discountAmount: 0, total: subtotal };
  }
  const discountAmount = roundMoney((subtotal * tier.discountPercent) / 100);
  return {
    subtotal,
    discountPercent: tier.discountPercent,
    discountAmount,
    total: roundMoney(subtotal - discountAmount),
  };
};

export type ResolvedCreditPackage = {
  title?: string;
  description?: string;
  credits: number;
  bonusCredits: number;
  /** What the buyer is charged: bonus credits are free, volume tier applied. */
  price: number;
  /** The same quantity at full price, when a volume tier brought it down. */
  fullPrice: number;
  discountPercent: number;
  /** Credits actually landing in the balance. */
  totalCredits: number;
};

/**
 * The bundles to show above the quantity stepper — only the ones the village
 * authored. A platform that has configured none offers the stepper alone
 * rather than a ladder of quantities nobody chose to sell.
 */
export const getCreditPackages = (
  creditConfig: CreditConfig | null | undefined,
  pricePerUnit: number,
): ResolvedCreditPackage[] => {
  const tiers = getVolumeDiscounts(creditConfig);
  const priced = (credits: number) =>
    getCreditPurchasePrice(credits, pricePerUnit, tiers);

  return (creditConfig?.packages ?? [])
    .map((pkg: CreditPackage): ResolvedCreditPackage | null => {
      const credits = toPositiveNumber(pkg?.credits);
      if (!credits) return null;
      const bonusCredits = toPositiveNumber(pkg?.bonusCredits) ?? 0;
      const price = priced(credits);
      return {
        title: pkg?.title || undefined,
        description: pkg?.description || undefined,
        credits,
        bonusCredits,
        price: price.total,
        fullPrice: price.subtotal,
        discountPercent: price.discountPercent,
        totalCredits: credits + bonusCredits,
      };
    })
    .filter((pkg): pkg is ResolvedCreditPackage => pkg !== null);
};

/**
 * The bonus a bundle grants for a given quantity, so the checkout can keep
 * honouring a bundle the buyer picked and then nudged with the stepper.
 */
export const getBonusCreditsForAmount = (
  packages: ResolvedCreditPackage[],
  amount: number,
): number =>
  packages.find((pkg) => pkg.credits === amount)?.bonusCredits ?? 0;
