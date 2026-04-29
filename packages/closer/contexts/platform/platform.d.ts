import type { FC, ReactNode } from 'react';

export declare const models: readonly string[];

export interface PlatformContextValue {
  platform: Record<string, any>;
}

export declare const PlatformProvider: FC<{ children: ReactNode }>;

export declare function usePlatform(): PlatformContextValue;
