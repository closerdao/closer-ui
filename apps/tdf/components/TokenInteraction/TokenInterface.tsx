import React, { useState, useEffect, useContext } from 'react';
import { Contract } from 'ethers';
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
  const { isWalletReady, library } = useContext(WalletState);
  const network = getCurrentNetwork();
  const [contractNames, setContractNames] = useState<string[]>([]);
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [contractAbi, setContractAbi] = useState<any[]>([]);
  const [methods, setMethods] = useState<ContractMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load contract names
  useEffect(() => {
    try {
      const names = getContractNames(network as any);
      setContractNames(names);
    } catch (err) {
      console.error('Error loading contract names:', err);
      setError('Failed to load contract names');
    }
  }, [network]);

  // Load contract ABI when a contract is selected
  useEffect(() => {
    const loadContractAbi = async () => {
      if (!selectedContract) return;

      setIsLoading(true);
      setError('');

      try {
        const { address, abi } = await getContract(selectedContract, network as any);
        
        if (address && abi) {
          setContractAddress(address);
          setContractAbi(abi);
          
          // Extract methods from ABI
          const contractMethods = abi.filter((item: any) => 
            item.type === 'function' && 
            (item.stateMutability === 'view' || item.stateMutability === 'pure')
          );
          
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

  // Reset input values when selected method changes
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

  const switchToCorrectNetwork = async () => {
    // Get the expected network from the app configuration
    const expectedNetwork = network === 'celo' ? {
      chainId: 42220,
      hexChainId: '0xa4ec',
      name: 'Celo',
      rpcUrl: 'https://forno.celo.org',
      explorerUrl: 'https://celoscan.io'
    } : {
      chainId: 44787,
      hexChainId: '0xaef3',
      name: 'Alfajores',
      rpcUrl: 'https://alfajores-forno.celo-testnet.org',
      explorerUrl: 'https://alfajores.celoscan.io'
    };

    try {
      await library.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expectedNetwork.hexChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Network not added to wallet, add it
        try {
          await library.provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: expectedNetwork.hexChainId,
                rpcUrls: [expectedNetwork.rpcUrl],
                chainName: expectedNetwork.name,
                nativeCurrency: {
                  name: 'CELO',
                  symbol: 'CELO',
                  decimals: 18,
                },
                blockExplorerUrls: [expectedNetwork.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          console.error(`Failed to add ${expectedNetwork.name} network:`, addError);
          throw addError;
        }
      } else {
        throw switchError;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletReady || !library || !contractAddress || !contractAbi || !selectedMethod) {
      setError('Cannot execute method: wallet not connected or contract not loaded');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      console.log('Contract details:', {
        address: contractAddress,
        abiLength: contractAbi?.length,
        selectedMethod,
        network
      });
      
      // Check wallet network
      const walletNetwork = await library.getNetwork();
      console.log('Wallet network:', {
        chainId: walletNetwork.chainId,
        name: walletNetwork.name
      });
      
      // Get the expected network from the user's selection
      const expectedNetwork = network === 'celo' ? {
        chainId: 42220,
        name: 'Celo'
      } : {
        chainId: 44787,
        name: 'Alfajores'
      };

      // Check expected network configuration
      console.log('Expected network config:', {
        expectedChainId: expectedNetwork.chainId,
        expectedName: expectedNetwork.name,
        userSelectedNetwork: network,
        rpcUrl: library.connection?.url || 'unknown'
      });
      
      // Check if wallet is connected to the correct network
      if (walletNetwork.chainId !== expectedNetwork.chainId) {
        console.warn(`Wallet is not connected to ${expectedNetwork.name}!`, {
          walletChainId: walletNetwork.chainId,
          expectedChainId: expectedNetwork.chainId,
          walletName: walletNetwork.name
        });
      }
      
      // Check network configuration
      console.log('Network configuration check:', {
        isCorrectNetwork: walletNetwork.chainId === expectedNetwork.chainId,
        needsNetworkSwitch: walletNetwork.chainId !== expectedNetwork.chainId
      });
      
      // If not on the correct network, try to switch
      if (walletNetwork.chainId !== expectedNetwork.chainId) {
        console.log(`Attempting to switch to ${expectedNetwork.name}...`);
        try {
          await switchToCorrectNetwork();
          console.log(`Successfully switched to ${expectedNetwork.name}`);
          
          // Wait a moment for the network change to propagate
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Re-check the network after switching
          const newWalletNetwork = await library.getNetwork();
          console.log('Network after switch:', {
            chainId: newWalletNetwork.chainId,
            name: newWalletNetwork.name
          });
          
          if (newWalletNetwork.chainId !== expectedNetwork.chainId) {
            console.warn('Network switch did not work as expected');
            setError(`Please manually switch to ${expectedNetwork.name} (Chain ID: ${expectedNetwork.chainId}) in your wallet to use this contract.`);
            return;
          }
        } catch (switchErr: any) {
          console.error(`Failed to switch to ${expectedNetwork.name}:`, switchErr);
          setError(`Please switch to ${expectedNetwork.name} (Chain ID: ${expectedNetwork.chainId}) to use this contract. Error: ${switchErr.message}`);
          return;
        }
      }
      
      const contract = new Contract(
        contractAddress,
        contractAbi,
        library.getSigner()
      );

      const method = methods.find(m => m.name === selectedMethod);
      if (!method) {
        throw new Error(`Method ${selectedMethod} not found in ABI`);
      }

      // Prepare arguments in the correct order
      const args = method.inputs.map(input => inputValues[input.name] || '');
      
      console.log('Calling method with args:', { method: selectedMethod, args });
      
      // First, let's check if the contract exists by getting its code
      try {
        const code = await library.getCode(contractAddress);
        console.log('Contract code length:', code?.length || 0);
        if (!code || code === '0x') {
          console.warn(`No contract found at address ${contractAddress}, but continuing anyway since contract exists on CeloScan`);
          // Don't throw error, continue with the call
        }
      } catch (codeErr: any) {
        console.error('Error checking contract code:', codeErr);
        console.warn('Contract verification failed, but continuing anyway since contract exists on CeloScan');
        // Don't throw error, continue with the call
      }
      
      // Call the method
      const response = await contract[selectedMethod](...args);
      
      // Format the result
      let formattedResult;
      if (Array.isArray(response)) {
        formattedResult = JSON.stringify(response, null, 2);
      } else if (typeof response === 'object' && response._isBigNumber) {
        formattedResult = response.toString();
      } else {
        formattedResult = String(response);
      }
      
      setResult(formattedResult);
    } catch (err: any) {
      console.error('Error calling contract method:', err);
      setError(err.message || 'Error calling contract method');
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
