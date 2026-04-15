import { useCallback, useEffect, useMemo, useState } from 'react';

import { Contract, providers, utils } from 'ethers';
import { useTranslations } from 'next-intl';

import { allNetworkConfigs } from '../../config_blockchain';
import { useWalletState } from '../../contexts/wallet/hooks';

type NetworkKey = keyof typeof allNetworkConfigs;

interface AbiInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
  components?: AbiInput[];
}

interface AbiEntry {
  type: string;
  name?: string;
  inputs?: AbiInput[];
  outputs?: AbiInput[];
  stateMutability?: string;
  anonymous?: boolean;
}

interface ContractDef {
  label: string;
  addressKey: string;
  abiKey: string;
  networks?: NetworkKey[];
}

const ALL_CONTRACT_DEFS: ContractDef[] = [
  {
    label: 'DAO Token (TDF)',
    addressKey: 'BLOCKCHAIN_DAO_TOKEN',
    abiKey: 'BLOCKCHAIN_DAO_TOKEN_ABI',
  },
  {
    label: 'Diamond DAO',
    addressKey: 'BLOCKCHAIN_DAO_DIAMOND_ADDRESS',
    abiKey: 'BLOCKCHAIN_DIAMOND_ABI',
  },
  {
    label: 'Dynamic Sale',
    addressKey: 'BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS',
    abiKey: 'BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI',
  },
  {
    label: 'Presence Token',
    addressKey: 'BLOCKCHAIN_PRESENCE_TOKEN',
    abiKey: 'BLOCKCHAIN_PRESENCE_ABI',
  },
  {
    label: 'Sweat Token',
    addressKey: 'BLOCKCHAIN_SWEAT_TOKEN',
    abiKey: 'BLOCKCHAIN_SWEAT_TOKEN_ABI',
    networks: ['celo'],
  },
];

const NETWORK_OPTIONS: { key: NetworkKey; label: string; chainId: number }[] = [
  { key: 'celo', label: 'Celo Mainnet', chainId: 42220 },
  { key: 'celoSepolia', label: 'Celo Sepolia', chainId: 11142220 },
];

function resolveAddress(config: Record<string, any>, key: string): string {
  const val = config[key];
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && val.address) return val.address;
  return '';
}

function formatResult(value: any): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object' && value._isBigNumber) {
    return `${value.toString()} (${utils.formatUnits(value, 18)} with 18 decimals)`;
  }
  if (Array.isArray(value)) {
    return JSON.stringify(
      value.map((v) => (v?._isBigNumber ? v.toString() : v)),
      null,
      2,
    );
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function FunctionCard({
  entry,
  contractAddress,
  abi,
  rpcUrl,
  library,
  isWalletNetwork,
}: {
  entry: AbiEntry;
  contractAddress: string;
  abi: AbiEntry[];
  rpcUrl: string;
  library: any;
  isWalletNetwork: boolean;
}) {
  const t = useTranslations();
  const isReadOnly =
    entry.stateMutability === 'view' || entry.stateMutability === 'pure';
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const parseInput = (value: string, type: string): any => {
    if (type.endsWith('[]')) {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(',').map((v) => v.trim());
      }
    }
    if (type.startsWith('uint') || type.startsWith('int')) {
      return value;
    }
    if (type === 'bool') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (type === 'bytes' || type.startsWith('bytes')) {
      return value;
    }
    return value;
  };

  const execute = useCallback(async () => {
    if (!contractAddress || !entry.name) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const args = (entry.inputs || []).map((inp) =>
        parseInput(inputs[inp.name] || '', inp.type),
      );

      if (isReadOnly) {
        const provider = new providers.JsonRpcProvider(rpcUrl);
        const contract = new Contract(contractAddress, abi, provider);
        const res = await contract[entry.name](...args);
        if (Array.isArray(res) && entry.outputs && entry.outputs.length > 1) {
          const formatted = entry.outputs.map((out, i) => ({
            [out.name || `output_${i}`]: formatResult(res[i]),
          }));
          setResult(JSON.stringify(formatted, null, 2));
        } else {
          setResult(formatResult(res));
        }
      } else {
        if (!library) {
          setError(t('contracts_connect_wallet_first'));
          return;
        }
        if (!isWalletNetwork) {
          setError(t('contracts_wrong_network'));
          return;
        }
        const signer = library.getUncheckedSigner();
        const contract = new Contract(contractAddress, abi, signer);
        const tx = await contract[entry.name](...args);
        setResult(`tx: ${tx.hash}`);
        await tx.wait();
        setResult(`${t('contracts_tx_confirmed')}: ${tx.hash}`);
      }
    } catch (err: any) {
      const msg =
        err?.reason || err?.data?.message || err?.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, abi, entry, inputs, rpcUrl, library, isWalletNetwork]);

  const hasInputs = entry.inputs && entry.inputs.length > 0;

  return (
    <div className="border border-neutral-200 rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded ${
              isReadOnly
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isReadOnly ? 'read' : 'write'}
          </span>
          <span className="font-mono text-sm font-medium">{entry.name}</span>
          {hasInputs && (
            <span className="text-xs text-neutral-400">
              ({entry.inputs!.map((i) => `${i.type} ${i.name}`).join(', ')})
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-neutral-100 pt-3">
          {entry.inputs?.map((inp) => (
            <div key={inp.name} className="flex flex-col gap-1">
              <label className="text-xs font-mono text-neutral-500">
                {inp.name}{' '}
                <span className="text-neutral-400">({inp.type})</span>
              </label>
              <input
                type="text"
                placeholder={inp.type}
                value={inputs[inp.name] || ''}
                onChange={(e) => handleInputChange(inp.name, e.target.value)}
                className="border border-neutral-300 rounded px-3 py-1.5 text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          ))}

          {entry.outputs && entry.outputs.length > 0 && (
            <div className="text-xs text-neutral-400 font-mono">
              → {entry.outputs.map((o) => `${o.type}${o.name ? ` ${o.name}` : ''}`).join(', ')}
            </div>
          )}

          <button
            onClick={execute}
            disabled={loading}
            className={`self-start px-4 py-2 rounded text-sm font-medium transition-colors ${
              isReadOnly
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            } disabled:opacity-50`}
          >
            {loading
              ? t('contracts_loading')
              : isReadOnly
                ? t('contracts_call')
                : t('contracts_send')}
          </button>

          {result && (
            <pre className="bg-green-50 border border-green-200 rounded p-3 text-xs font-mono text-green-800 whitespace-pre-wrap break-all max-h-48 overflow-auto">
              {result}
            </pre>
          )}
          {error && (
            <pre className="bg-red-50 border border-red-200 rounded p-3 text-xs font-mono text-red-800 whitespace-pre-wrap break-all max-h-48 overflow-auto">
              {error}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

const ContractInteraction = () => {
  const t = useTranslations();
  const { library } = useWalletState();

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>(() => {
    const env = process.env.NEXT_PUBLIC_NETWORK;
    if (env === 'celo' || env === 'celoSepolia') return env;
    return 'celo';
  });

  const [selectedContractIdx, setSelectedContractIdx] = useState(0);
  const [filterText, setFilterText] = useState('');
  const [showReadOnly, setShowReadOnly] = useState(true);
  const [showWrite, setShowWrite] = useState(true);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!library) {
      setWalletChainId(null);
      return;
    }
    let cancelled = false;
    library.getNetwork().then((net: { chainId: number }) => {
      if (!cancelled) setWalletChainId(net.chainId);
    }).catch(() => {
      if (!cancelled) setWalletChainId(null);
    });
    return () => { cancelled = true; };
  }, [library]);

  const switchWalletNetwork = useCallback(async () => {
    if (!library) return;
    const target = NETWORK_OPTIONS.find((n) => n.key === selectedNetwork);
    if (!target) return;
    setSwitching(true);
    try {
      const hexChainId = `0x${target.chainId.toString(16)}`;
      await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      const net = await library.getNetwork();
      setWalletChainId(net.chainId);
    } catch (err: any) {
      if (err?.code === 4902) {
        const cfg = allNetworkConfigs[selectedNetwork];
        const hexChainId = `0x${NETWORK_OPTIONS.find((n) => n.key === selectedNetwork)!.chainId.toString(16)}`;
        try {
          await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: cfg.BLOCKCHAIN_NAME,
              nativeCurrency: cfg.BLOCKCHAIN_NATIVE_TOKEN,
              rpcUrls: [cfg.BLOCKCHAIN_RPC_URL],
              blockExplorerUrls: [cfg.BLOCKCHAIN_EXPLORER_URL],
            }],
          });
          const net = await library.getNetwork();
          setWalletChainId(net.chainId);
        } catch {
          // user rejected adding the chain
        }
      }
    } finally {
      setSwitching(false);
    }
  }, [library, selectedNetwork]);

  const networkConfig = allNetworkConfigs[selectedNetwork];
  const rpcUrl = networkConfig.BLOCKCHAIN_RPC_URL;
  const explorerUrl = networkConfig.BLOCKCHAIN_EXPLORER_URL;

  const availableContracts = useMemo(() => {
    return ALL_CONTRACT_DEFS.filter(
      (def) => !def.networks || def.networks.includes(selectedNetwork),
    );
  }, [selectedNetwork]);

  const safeIdx = selectedContractIdx < availableContracts.length
    ? selectedContractIdx
    : 0;
  const selectedDef = availableContracts[safeIdx];

  const contractAddress = resolveAddress(networkConfig, selectedDef.addressKey);
  const abi: AbiEntry[] = (networkConfig as any)[selectedDef.abiKey] || [];

  const networkOption = NETWORK_OPTIONS.find(
    (n) => n.key === selectedNetwork,
  )!;
  const isWalletNetwork = walletChainId === networkOption.chainId;

  const functions = useMemo(() => {
    return abi
      .filter((e) => e.type === 'function' && e.name)
      .sort((a, b) => {
        const aRead =
          a.stateMutability === 'view' || a.stateMutability === 'pure';
        const bRead =
          b.stateMutability === 'view' || b.stateMutability === 'pure';
        if (aRead !== bRead) return aRead ? -1 : 1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [abi]);

  const filteredFunctions = useMemo(() => {
    return functions.filter((fn) => {
      const isRead =
        fn.stateMutability === 'view' || fn.stateMutability === 'pure';
      if (isRead && !showReadOnly) return false;
      if (!isRead && !showWrite) return false;
      if (filterText) {
        return fn.name?.toLowerCase().includes(filterText.toLowerCase());
      }
      return true;
    });
  }, [functions, filterText, showReadOnly, showWrite]);

  const readCount = functions.filter(
    (f) => f.stateMutability === 'view' || f.stateMutability === 'pure',
  ).length;
  const writeCount = functions.length - readCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-neutral-600">
            {t('contracts_network')}
          </label>
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
            {NETWORK_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSelectedNetwork(opt.key);
                  setSelectedContractIdx(0);
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  selectedNetwork === opt.key
                    ? 'bg-primary text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-sm font-medium text-neutral-600">
            {t('contracts_contract')}
          </label>
          <select
            value={safeIdx}
            onChange={(e) => setSelectedContractIdx(Number(e.target.value))}
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          >
            {availableContracts.map((def, idx) => (
              <option key={def.label} value={idx}>
                {def.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="text-neutral-500">{t('contracts_address')}</span>
          {contractAddress ? (
            <a
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline truncate"
            >
              {contractAddress}
            </a>
          ) : (
            <span className="text-neutral-400 italic">
              {t('contracts_not_deployed')}
            </span>
          )}
        </div>
        <div className="flex gap-4 text-neutral-500">
          <span>
            {readCount} {t('contracts_read_fns')}
          </span>
          <span>
            {writeCount} {t('contracts_write_fns')}
          </span>
        </div>
      </div>

      {!isWalletNetwork && library && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-amber-800">
            {t('contracts_wallet_network_mismatch')}
          </span>
          <button
            onClick={switchWalletNetwork}
            disabled={switching}
            className="shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
          >
            {switching ? t('contracts_switching') : t('contracts_switch_network')}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={t('contracts_filter_placeholder')}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="flex-1 border border-neutral-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowReadOnly(!showReadOnly)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showReadOnly
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            {t('contracts_read')} ({readCount})
          </button>
          <button
            onClick={() => setShowWrite(!showWrite)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showWrite
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}
          >
            {t('contracts_write')} ({writeCount})
          </button>
        </div>
      </div>

      {!contractAddress && (
        <div className="text-center py-12 text-neutral-400">
          {t('contracts_no_address')}
        </div>
      )}

      {contractAddress && filteredFunctions.length === 0 && (
        <div className="text-center py-12 text-neutral-400">
          {t('contracts_no_functions')}
        </div>
      )}

      {contractAddress && (
        <div className="flex flex-col gap-2">
          {filteredFunctions.map((entry) => (
            <FunctionCard
              key={entry.name}
              entry={entry}
              contractAddress={contractAddress}
              abi={abi}
              rpcUrl={rpcUrl}
              library={library}
              isWalletNetwork={isWalletNetwork}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractInteraction;
