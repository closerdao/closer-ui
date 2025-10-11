import fs from 'fs';
import path from 'path';

/**
 * Dynamically loads all ABIs for a specific network
 * @param network - The network to load ABIs for ('celo' or 'alfajores')
 * @returns An object containing all ABIs for the specified network
 */
export const loadAllAbis = (network = 'celo') => {
  const validNetworks = ['celo', 'alfajores'];
  const networkToUse = validNetworks.includes(network) ? network : 'celo';
  
  const abiPath = path.join(process.cwd(), 'abis', networkToUse);
  
  try {
    // Get all JSON files in the network directory
    const files = fs.readdirSync(abiPath).filter(file => file.endsWith('.json'));
    
    // Load each ABI file
    const abis: Record<string, any> = {};
    
    for (const file of files) {
      const filePath = path.join(abiPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const contractName = file.replace('.json', '');
      
      try {
        const parsedContent = JSON.parse(fileContent);
        abis[contractName] = parsedContent;
      } catch (error) {
        console.error(`Error parsing ABI file ${file}:`, error);
      }
    }
    
    return abis;
  } catch (error) {
    console.error(`Error loading ABIs for network ${networkToUse}:`, error);
    return {};
  }
};

/**
 * Gets a specific ABI for a contract
 * @param contractName - The name of the contract (without .json extension)
 * @param network - The network to load the ABI from ('celo' or 'alfajores')
 * @returns The ABI for the specified contract
 */
export const getAbi = (contractName: string, network = 'celo') => {
  const validNetworks = ['celo', 'alfajores'];
  const networkToUse = validNetworks.includes(network) ? network : 'celo';
  
  const abiPath = path.join(process.cwd(), 'abis', networkToUse, `${contractName}.json`);
  
  try {
    const fileContent = fs.readFileSync(abiPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading ABI for contract ${contractName} on network ${networkToUse}:`, error);
    return null;
  }
};

/**
 * Gets all available contract names for a specific network
 * @param network - The network to get contract names for ('celo' or 'alfajores')
 * @returns An array of contract names
 */
export const getContractNames = (network = 'celo') => {
  const validNetworks = ['celo', 'alfajores'];
  const networkToUse = validNetworks.includes(network) ? network : 'celo';
  
  const abiPath = path.join(process.cwd(), 'abis', networkToUse);
  
  try {
    const files = fs.readdirSync(abiPath).filter(file => file.endsWith('.json'));
    return files.map(file => file.replace('.json', ''));
  } catch (error) {
    console.error(`Error getting contract names for network ${networkToUse}:`, error);
    return [];
  }
};
