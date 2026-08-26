import React from 'react';

import { useTranslations } from 'next-intl';

import { blockchainConfig } from '../../config_blockchain';
import {
  TokenPromoShell,
  usePromoText,
  type TokenPromoContent,
} from './CustomTokenPagePromo';

interface Props {
  settings?: Record<string, unknown>;
  content?: TokenPromoContent;
}

const shortenAddress = (address: string): string =>
  `${address.slice(0, 6)}…${address.slice(-4)}`;

/**
 * Surfaces the platform's main on-chain contracts (from config_blockchain)
 * with links to the block explorer, then hands off to /token/contracts for
 * direct interaction.
 */
const CustomTokenContractsPromo = ({ content }: Props) => {
  const t = useTranslations();
  const text = usePromoText();

  const {
    BLOCKCHAIN_NAME,
    BLOCKCHAIN_EXPLORER_URL,
    BLOCKCHAIN_DAO_TOKEN,
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  } = (blockchainConfig ?? {}) as {
    BLOCKCHAIN_NAME?: string;
    BLOCKCHAIN_EXPLORER_URL?: string;
    BLOCKCHAIN_DAO_TOKEN?: { address?: string; symbol?: string };
    BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS?: string;
    BLOCKCHAIN_DAO_DIAMOND_ADDRESS?: string;
  };

  const tokenSymbol = BLOCKCHAIN_DAO_TOKEN?.symbol || 'TOKEN';
  const contracts = [
    {
      name: t('token_promo_contracts_token_contract', { token: tokenSymbol }),
      address: BLOCKCHAIN_DAO_TOKEN?.address,
    },
    {
      name: t('token_promo_contracts_sale_contract'),
      address: BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
    },
    {
      name: t('token_promo_contracts_dao_contract'),
      address: BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
    },
  ].filter((contract): contract is { name: string; address: string } =>
    Boolean(contract.address),
  );

  return (
    <TokenPromoShell
      eyebrow={text(content?.eyebrow)}
      title={text(content?.title)}
      description={text(content?.description)}
      ctaText={text(content?.ctaText)}
      ctaLink={content?.ctaLink?.trim() || '/token/contracts'}
      footnote={
        BLOCKCHAIN_NAME
          ? t('token_promo_contracts_network_note', {
              network: BLOCKCHAIN_NAME,
            })
          : undefined
      }
    >
      {contracts.length > 0 ? (
        <ul className="flex flex-col divide-y divide-gray-100 rounded-md border border-gray-100">
          {contracts.map((contract) => (
            <li
              key={contract.address}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3"
            >
              <span className="text-base text-gray-800">{contract.name}</span>
              {BLOCKCHAIN_EXPLORER_URL ? (
                <a
                  href={`${BLOCKCHAIN_EXPLORER_URL.replace(/\/$/, '')}/address/${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-accent underline underline-offset-2"
                  title={contract.address}
                >
                  {shortenAddress(contract.address)} ↗
                </a>
              ) : (
                <span
                  className="font-mono text-sm text-gray-500"
                  title={contract.address}
                >
                  {shortenAddress(contract.address)}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </TokenPromoShell>
  );
};

export default CustomTokenContractsPromo;
