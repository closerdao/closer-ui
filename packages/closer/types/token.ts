export interface TokenStats {
  tokenHolders: number;
  tokenPrice: number;
  currentSupply: number;
  lastUpdated: string;
}

export const DEFAULT_TOKEN_STATS: TokenStats = {
  tokenHolders: 282,
  tokenPrice: 259,
  currentSupply: 6350,
  lastUpdated: '2026-02-01T00:00:00.000Z',
};
