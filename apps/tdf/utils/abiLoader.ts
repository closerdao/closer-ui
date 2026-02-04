/**
 * Client-side ABI loader for TDF application
 * This module dynamically imports ABIs based on the current network
 */

// Import network configuration
import { blockchainConfig } from 'closer';

// Define the network type
type Network = 'celo' | 'alfajores' | 'celoSepolia';

// Import ABIs for Celo network
import PresenceTokenCelo from '../abis/celo/PresenceToken.json';
import SweatTokenCelo from '../abis/celo/SweatToken.json';
import SweatTokenImplementationCelo from '../abis/celo/SweatToken_Implementation.json';
import TDFTokenCelo from '../abis/celo/TDFToken.json';
import CitizenNFTCelo from '../abis/celo/CitizenNFT.json';

// Import ABIs for Alfajores network
import PresenceTokenAlfajores from '../abis/alfajores/PresenceToken.json';
import SweatTokenAlfajores from '../abis/alfajores/SweatToken.json';
import TDFTokenAlfajores from '../abis/alfajores/TDFToken.json';

// Import ABIs for Celo Sepolia network
import PresenceTokenCeloSepolia from '../abis/celoSepolia/PresenceToken.json';
import SweatTokenCeloSepolia from '../abis/celoSepolia/SweatToken.json';
import SweatTokenImplementationCeloSepolia from '../abis/celoSepolia/SweatToken_Implementation.json';
import TDFTokenCeloSepolia from '../abis/celoSepolia/TDFToken.json';

// Define ABI collections for each network
const celoAbis = {
  PresenceToken: PresenceTokenCelo,
  SweatToken: SweatTokenCelo,
  SweatTokenImplementation: SweatTokenImplementationCelo,
  TDFToken: TDFTokenCelo,
  CitizenNFT: CitizenNFTCelo,
};

const alfajoresAbis = {
  PresenceToken: PresenceTokenAlfajores,
  SweatToken: SweatTokenAlfajores,
  TDFToken: TDFTokenAlfajores,
};

const celoSepoliaAbis = {
  PresenceToken: PresenceTokenCeloSepolia,
  SweatToken: SweatTokenCeloSepolia,
  SweatTokenImplementation: SweatTokenImplementationCeloSepolia,
  TDFToken: TDFTokenCeloSepolia,
};

// Cache for loaded ABIs to avoid repeated imports
const abiCache: Record<string, Record<string, any>> = {
  celo: {},
  alfajores: {},
  celoSepolia: {}
};

/**
 * Determines the current network from environment or defaults to celo
 */
export const getCurrentNetwork = (): Network => {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  return (network === 'celo' || network === 'alfajores' || network === 'celoSepolia') ? network as Network : 'celo';
};

/**
 * Gets all available contract names for a specific network
 * @param network - The network to get contract names for ('celo' or 'alfajores')
 * @returns An array of contract names
 */
export const getContractNames = (network: Network = getCurrentNetwork()): string[] => {
  if (network === 'celo') return Object.keys(celoAbis);
  if (network === 'celoSepolia') return Object.keys(celoSepoliaAbis);
  return Object.keys(alfajoresAbis);
};

/**
 * Gets the ABI for a specific contract
 * @param contractName - The name of the contract (without .json extension)
 * @param network - The network to load the ABI from ('celo' or 'alfajores')
 * @returns The ABI for the specified contract
 */
export const getAbi = (contractName: string, network: Network = getCurrentNetwork()) => {
  // Check cache first
  if (abiCache[network][contractName]) {
    return abiCache[network][contractName];
  }

  const abiCollection = network === 'celo' ? celoAbis : network === 'celoSepolia' ? celoSepoliaAbis : alfajoresAbis;
  const abi = abiCollection[contractName as keyof typeof abiCollection];
  
  if (abi) {
    abiCache[network][contractName] = abi;
    return abi;
  }
  
  console.error(`ABI not found for ${contractName} on ${network}`);
  return null;
};

/**
 * Gets the contract address from the ABI file
 * @param contractName - The name of the contract (without .json extension)
 * @param network - The network to load the ABI from ('celo' or 'alfajores')
 * @returns The contract address
 */
export const getContractAddress = (contractName: string, network: Network = getCurrentNetwork()) => {
  const abi = getAbi(contractName, network);
  return abi?.address || null;
};

/**
 * Gets the contract ABI array from the ABI file
 * @param contractName - The name of the contract (without .json extension)
 * @param network - The network to load the ABI from ('celo' or 'alfajores')
 * @returns The contract ABI array
 */
export const getContractAbi = (contractName: string, network: Network = getCurrentNetwork()) => {
  const abi = getAbi(contractName, network);
  return abi?.abi || null;
};

/**
 * Helper function to get both address and ABI for a contract
 * @param contractName - The name of the contract (without .json extension)
 * @param network - The network to load the ABI from ('celo' or 'alfajores')
 * @returns An object containing the address and ABI
 */
export const getContract = (contractName: string, network: Network = getCurrentNetwork()) => {
  const abi = getAbi(contractName, network);
  
  // Special handling for SweatToken - use implementation ABI on Celo network
  if ((network === 'celo' || network === 'celoSepolia') && contractName === 'SweatToken') {
    const proxyAbi = getAbi('SweatToken', network);
    const implementationAbi = getAbi('SweatTokenImplementation', network);
    
    console.log(`SweatToken proxy on Celo:`, {
      proxyAddress: proxyAbi?.address,
      implementationAbiLength: implementationAbi?.abi?.length,
      hasImplementation: !!implementationAbi?.abi
    });
    
    return {
      address: proxyAbi?.address || null,
      abi: implementationAbi?.abi || null
    };
  }
  
  return {
    address: abi?.address || null,
    abi: abi?.abi || null
  };
};

/**
 * Gets the network ID for the current network
 * @returns The network ID
 */
export const getNetworkId = () => {
  return blockchainConfig.BLOCKCHAIN_NETWORK_ID;
};

/**
 * Gets the network name for the current network
 * @returns The network name
 */
export const getNetworkName = () => {
  return blockchainConfig.BLOCKCHAIN_NAME;
};
