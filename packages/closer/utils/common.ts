import { parseSmartContractError } from './smartContractErrorParser';

export const parseMessageFromError = (err: any): string => {
  try {
    if (typeof err === 'string') {
      return err;
    }

    const smartContractError = parseSmartContractError(err);
    if (smartContractError) {
      return smartContractError;
    }

    if (err?.response?.data?.error) {
      const v = err.response.data.error;
      return typeof v === 'string' ? v : String(v);
    }
    if (err instanceof Error) {
      return typeof err.message === 'string' ? err.message : 'Something went wrong';
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      const v = (err as { message: unknown }).message;
      return typeof v === 'string' ? v : 'Something went wrong';
    }

    try {
      return JSON.stringify(err);
    } catch {
      return 'Something went wrong';
    }
  } catch {
    return 'Something went wrong';
  }
};

export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD') // Normalize to remove diacritics
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple consecutive hyphens
    .trim(); // Trim leading/trailing spaces
