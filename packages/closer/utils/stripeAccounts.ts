import type {
  AccountingEntitiesConfig,
  ConnectedStripeAccount,
  PaymentConfig,
} from '../types/api';
import { resolveAccountingEntityForProduct } from './accountingEntityResolve';
import { getCachedConfig } from './cachedConfig.helpers';

export const listConnectedAccounts = (
  paymentConfig?: Partial<PaymentConfig> | null,
): ConnectedStripeAccount[] => {
  const stored = paymentConfig?.connectedAccounts;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.filter((account) => Boolean(account?.id));
  }
  const legacyId = paymentConfig?.connectedAccountId;
  if (!legacyId) {
    return [];
  }
  return [
    {
      id: legacyId,
      name: '',
      label: '',
      connectStatus: paymentConfig?.connectStatus || null,
      connectActivatedAt: paymentConfig?.connectActivatedAt || null,
    },
  ];
};

export const resolveDefaultConnectedAccountId = (
  paymentConfig?: Partial<PaymentConfig> | null,
): string | null => {
  const accounts = listConnectedAccounts(paymentConfig);
  const pointed = paymentConfig?.defaultConnectedAccountId;
  if (pointed && accounts.some((account) => account.id === pointed)) {
    return pointed;
  }
  return accounts[0]?.id || paymentConfig?.connectedAccountId || null;
};

export const isVillageConnectedAccount = (
  paymentConfig: Partial<PaymentConfig> | null | undefined,
  id: string | null | undefined,
): boolean => {
  if (!id) {
    return false;
  }
  return listConnectedAccounts(paymentConfig).some(
    (account) => account.id === id,
  );
};

export const stripeAccountSelectValue = (
  fieldValue: unknown,
  connectedAccountId?: string | null,
): string => {
  const raw = typeof fieldValue === 'string' ? fieldValue.trim() : '';
  if (!raw || raw === 'default') {
    return 'default';
  }
  if (connectedAccountId && raw === connectedAccountId) {
    return 'default';
  }
  return raw;
};

export const accountDisplayName = (account: ConnectedStripeAccount): string => {
  const label = account.label?.trim();
  if (label) {
    return label;
  }
  const name = account.name?.trim();
  return name || account.id;
};

export const resolveStripeAccountForCharge = (
  paymentConfig: Partial<PaymentConfig> | null | undefined,
  accountingConfig: AccountingEntitiesConfig | null | undefined,
  { productKeys }: { productKeys?: string | string[] } = {},
): { accountId: string | null; disabled: boolean } => {
  const keys = Array.isArray(productKeys)
    ? productKeys
    : productKeys
      ? [productKeys]
      : [];
  const entity = keys.reduce(
    (acc, key) =>
      acc || resolveAccountingEntityForProduct(key, accountingConfig?.elements),
    null as ReturnType<typeof resolveAccountingEntityForProduct>,
  );
  const configured =
    typeof entity?.stripeAccount === 'string'
      ? entity.stripeAccount.trim()
      : '';
  const defaultId = resolveDefaultConnectedAccountId(paymentConfig);
  if (accountingConfig?.enabled === false) {
    return { accountId: defaultId, disabled: false };
  }
  if (configured === 'none') {
    return { accountId: null, disabled: true };
  }
  if (!configured || configured === 'default') {
    return { accountId: defaultId, disabled: false };
  }
  if (!isVillageConnectedAccount(paymentConfig, configured)) {
    return { accountId: null, disabled: true };
  }
  return { accountId: configured, disabled: false };
};

export const chargeAccountFromCache = (
  paymentConfig: Partial<PaymentConfig> | null | undefined,
  productKeys: string | string[],
) =>
  resolveStripeAccountForCharge(
    paymentConfig,
    getCachedConfig('accounting-entities') as AccountingEntitiesConfig | null,
    { productKeys },
  );
