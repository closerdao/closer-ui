import { parseSmartContractError } from './smartContractErrorParser';

export const parseMessageFromError = (err: any) => {
  try {
    if (typeof err === 'string') {
      return err;
    }

    // Try smart contract error parsing first
    const smartContractError = parseSmartContractError(err);
    if (smartContractError) {
      return smartContractError;
    }

    if (err?.response?.data?.error) {
      return err.response?.data?.error;
    }
    if (err instanceof Error) {
      return err.message;
    }

    if (typeof err === 'object' && err !== null && 'message' in err) {
      return err.message;
    }

    // Handle circular references and other complex objects
    try {
      return JSON.stringify(err);
    } catch (jsonError) {
      return 'Complex object that could not be stringified';
    }
  } catch (error) {
    return 'Error parsing error message';
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
