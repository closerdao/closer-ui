export type DonationPaymentMethod = 'bank' | 'card' | 'crypto';

export type CreateDonationBankResult = {
  saleId: string;
  memoCode: string;
  closerIban: string;
  beneficiary?: string;
  beneficiaryAddress?: string;
  beneficiaryBic?: string;
};

export type CreateDonationCardResult = {
  saleId: string;
  clientSecret: string;
  paymentIntentId: string;
};

export type CreateDonationCryptoResult = {
  saleId: string;
  treasuryAddress: string;
  stablecoin: string;
  expectedAmount: number;
};

export type CreateDonationResult =
  | CreateDonationBankResult
  | CreateDonationCardResult
  | CreateDonationCryptoResult;
