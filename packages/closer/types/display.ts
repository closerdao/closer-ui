import type { ReactNode } from 'react';

export type WalletDisplayVariant = 'default' | 'inline';

export interface WalletDisplayProps {
  address: string;
  className?: string;
  showCopy?: boolean;
  variant?: WalletDisplayVariant;
}

export interface ExternalLinkDisplayProps {
  href: string;
  children?: ReactNode;
  className?: string;
  maxDisplayLength?: number;
}

export interface EmailDisplayProps {
  email: string;
  className?: string;
  showIcon?: boolean;
}

export interface FormattedPlainTextProps {
  text: string;
  className?: string;
}
