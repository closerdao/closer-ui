import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useSwitchChain, useChainId } from 'wagmi';
import { createPublicClient, http, defineChain } from 'viem';
import { WalletState } from 'closer/contexts/wallet';
import { getContract, getCurrentNetwork, getContractNames } from '../../utils/abiLoader';

interface TokenInterfaceProps {
  className?: string;
}

interface ContractMethod {
  name: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  stateMutability: string;
}

const TokenInterface: React.FC<TokenInterfaceProps> = ({ className }) => {
  const { isWalletReady } = useContext(WalletState);
  const { switchChain } = useSwitchChain();
  const currentChainId = useChainId();
  const network = getCurrentNetwork();

  const [contractNames, setContractNames] = useState<string[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [contractAbi, setContractAbi] = useState<readonly unknown[]>([]);
  const [methods, setMethods] = useState<ContractMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getPublicClient = useCallback(() => {
    const rpcUrl = network === 'celo' 
      ? 'https://forno.celo.org' 
      : 'https://alfajores-forno.celo-testnet.org';
    const chainId = network === 'celo' ? CELO_CHAIN_ID : ALFAJORES_CHAIN_ID;
    const chain = defineChain({
      id: chainId,
      name: network === 'celo' ? 'Celo' : 'Alfajores',
      nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });
    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }, [network]);

  useEffect(() => {
    try {
      const names = getContractNames(network as 'celo' | 'alfajores');
      setContractNames(names);
    } catch (err) {
      console.error('Error loading contract names:', err);
      setError('Failed to load contract names');
    }
  }, [network]);

  useEffect(() => {
    const loadContractAbi = async () => {
      if (!selectedContract) return;

      setIsLoading(true);
      setError('');

      try {
        const { address, abi } = await getContract(selectedContract, network as 'celo' | 'alfajores');

        if (address && abi) {
          setContractAddress(address);
          setContractAbi(abi);

          const contractMethods = abi.filter((item: { type?: string; stateMutability?: string }) =>
            item.type === 'function' &&
            (item.stateMutability === 'view' || item.stateMutability === 'pure')
          ) as ContractMethod[];

          setMethods(contractMethods);
        } else {
          setError(`Failed to load ABI for ${selectedContract}`);
        }
      } catch (err) {
        console.error(`Error loading ABI for ${selectedContract}:`, err);
        setError(`Error loading ABI for ${selectedContract}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadContractAbi();
  }, [selectedContract, network]);

  useEffect(() => {
    setInputValues({});
    setResult('');
  }, [selectedMethod]);

  const handleContractChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedContract(e.target.value);
    setSelectedMethod('');
    setResult('');
    setError('');
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMethod(e.target.value);
    setResult('');
    setError('');
  };

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  const CELO_CHAIN_ID = 42220;
  const ALFAJORES_CHAIN_ID = 44787;

  const switchToCorrectNetwork = async () => {
    const expectedChainId = network === 'celo' ? CELO_CHAIN_ID : ALFAJORES_CHAIN_ID;

    try {
      if (switchChain) {
        switchChain({ chainId: expectedChainId });
      }
    } catch (switchError) {
      console.error('Failed to switch network:', switchError);
      throw switchError;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWalletReady || !contractAddress || !contractAbi.length || !selectedMethod) {
      setError('Cannot execute method: wallet not connected or contract not loaded');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    const expectedChainId = network === 'celo' ? CELO_CHAIN_ID : ALFAJORES_CHAIN_ID;

    if (currentChainId !== expectedChainId) {
      console.log('Attempting to switch network...');
      try {
        await switchToCorrectNetwork();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (currentChainId !== expectedChainId) {
          setError('Please manually switch to the correct network in your wallet.');
          setIsLoading(false);
          return;
        }
      } catch (switchErr) {
        console.error('Failed to switch network:', switchErr);
        setError('Please switch to the correct network.');
        setIsLoading(false);
        return;
      }
    }

    const method = methods.find(m => m.name === selectedMethod);
    if (!method) {
      setError(`Method ${selectedMethod} not found in ABI`);
      setIsLoading(false);
      return;
    }

    const args = method.inputs.map(input => inputValues[input.name] || '');
    console.log('Calling method with args:', { method: selectedMethod, args });

    try {
      const publicClient = getPublicClient();
      const response = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName: selectedMethod,
        args,
      });

      let formattedResult;
      if (Array.isArray(response)) {
        formattedResult = JSON.stringify(response, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value, 2);
      } else if (typeof response === 'bigint') {
        formattedResult = response.toString();
      } else {
        formattedResult = String(response);
      }

      setResult(formattedResult);
    } catch (err) {
      console.error('Error calling contract method:', err);
      setError(err instanceof Error ? err.message : 'Error calling contract method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 border rounded-lg shadow-sm ${className}`}>
      <h2 className="text-xl font-bold mb-4">Token Interaction Interface</h2>

      {!isWalletReady ? (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p>Please connect your wallet to interact with tokens.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contract
            </label>
            <select
              value={selectedContract}
              onChange={handleContractChange}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select a contract</option>
              {contractNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {selectedContract && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contract Address
              </label>
              <div className="w-full px-3 py-2 border rounded-md bg-gray-50">
                {contractAddress || 'Loading...'}
              </div>
            </div>
          )}

          {selectedContract && methods.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Method
              </label>
              <select
                value={selectedMethod}
                onChange={handleMethodChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a method</option>
                {methods.map((method) => (
                  <option key={method.name} value={method.name}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedMethod && (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Method Parameters</h3>
                {methods
                  .find(m => m.name === selectedMethod)
                  ?.inputs.map((input, index) => (
                    <div key={index} className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {input.name} ({input.type})
                      </label>
                      <input
                        type="text"
                        value={inputValues[input.name] || ''}
                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder={`Enter ${input.type} value`}
                      />
                    </div>
                  ))}
              </div>

              <div className="mb-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`py-2 px-4 rounded-md ${
                    isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-accent hover:bg-accent-dark text-white'
                  }`}
                >
                  {isLoading ? 'Executing...' : 'Execute Method'}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Result</h3>
              <div className="p-3 bg-gray-100 rounded-md overflow-auto max-h-60">
                <pre className="text-sm">{result}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TokenInterface;
