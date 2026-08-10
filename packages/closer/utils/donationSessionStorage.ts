import type {
  CreateDonationBankResult,
  CreateDonationCardResult,
  CreateDonationCryptoResult,
} from '../types/donation';

export type StoredDonationBank = {
  kind: 'bank';
  amount: number;
  result: CreateDonationBankResult;
};

export type StoredDonationCard = {
  kind: 'card';
  amount: number;
  result: CreateDonationCardResult;
};

export type StoredDonationCrypto = {
  kind: 'crypto';
  amount: number;
  result: CreateDonationCryptoResult;
};

export type StoredDonation = StoredDonationBank | StoredDonationCard | StoredDonationCrypto;

const storageKey = (saleId: string) => `closer-donation-session-${saleId}`;

export function saveDonationSession(saleId: string, payload: StoredDonation): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(storageKey(saleId), JSON.stringify(payload));
  } catch {
    return;
  }
}

export function readDonationSession(saleId: string): StoredDonation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(saleId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDonation;
    if (!parsed || typeof parsed !== 'object' || !('kind' in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}
