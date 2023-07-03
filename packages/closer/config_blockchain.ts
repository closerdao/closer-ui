const alfajoresConfig = {
  BLOCKCHAIN_NETWORK_ID: 44787,
  BLOCKCHAIN_NAME: 'CELO ALFAJORES',
  BLOCKCHAIN_RPC_URL: 'https://alfajores-forno.celo-testnet.org',
  BLOCKCHAIN_EXPLORER_URL: 'https://alfajores-blockscout.celo-testnet.org',
  BLOCKCHAIN_NATIVE_TOKEN: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  BLOCKCHAIN_DAO_TOKEN: {
    address: '0x264C27Cfe514E430e3E35e5F7fAcdbF976E2a611',
    name: 'TDF',
    symbol: 'TDF',
    decimals: 18,
  },
  BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS:
    '0x9FEcD2e17d8aBcfC0BbFb3fC79197033B9347D76',
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS: '0x063Ac15fa27F0068f34347d4EEC8777c531eeC3F',
  CEUR_TOKEN_ADDRESS: '0x83D99fb09b5BFc790D3e08c697b0852ECE40123C',
};

const celoConfig = {};

const getNetworkConfig = () => {
  const network = process.env.NEXT_PUBLIC_NETWORK;
  if (network === 'alfajores') {
    return alfajoresConfig;
  } else if (network === 'celo') {
    return celoConfig;
  }
};

export const blockchainConfig = {
  BLOCKCHAIN_DAO_TOKEN: {
    address: '0x264C27Cfe514E430e3E35e5F7fAcdbF976E2a611',
    name: 'TDF',
    symbol: 'TDF',
    decimals: 18,
  },
  ...getNetworkConfig(),
  BLOCKCHAIN_DAO_TOKEN_ABI: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'Approval',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint8',
          name: 'version',
          type: 'uint8',
        },
      ],
      name: 'Initialized',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferStarted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Paused',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'value',
          type: 'uint256',
        },
      ],
      name: 'Transfer',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Unpaused',
      type: 'event',
    },
    {
      inputs: [],
      name: 'acceptOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'owner',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
      ],
      name: 'allowance',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'approve',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'balanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'burn',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'burnFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'decimals',
      outputs: [
        {
          internalType: 'uint8',
          name: '',
          type: 'uint8',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'subtractedValue',
          type: 'uint256',
        },
      ],
      name: 'decreaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getDAOContract',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'addedValue',
          type: 'uint256',
        },
      ],
      name: 'increaseAllowance',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'manager',
          type: 'address',
        },
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'name',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'paused',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pendingOwner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'manager',
          type: 'address',
        },
      ],
      name: 'setDAOContract',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'symbol',
      outputs: [
        {
          internalType: 'string',
          name: '',
          type: 'string',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'transfer',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'transferFrom',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
  BLOCKCHAIN_DIAMOND_ABI: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_contractOwner',
          type: 'address',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'facetAddress',
              type: 'address',
            },
            {
              internalType: 'enum IDiamondCut.FacetCutAction',
              name: 'action',
              type: 'uint8',
            },
            {
              internalType: 'bytes4[]',
              name: 'functionSelectors',
              type: 'bytes4[]',
            },
          ],
          internalType: 'struct IDiamondCut.FacetCut[]',
          name: '_diamondCut',
          type: 'tuple[]',
        },
        {
          components: [
            {
              internalType: 'address',
              name: 'initContract',
              type: 'address',
            },
            {
              internalType: 'bytes',
              name: 'initData',
              type: 'bytes',
            },
          ],
          internalType: 'struct Diamond.Initialization[]',
          name: '_initializations',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'payable',
      type: 'constructor',
    },
    {
      stateMutability: 'payable',
      type: 'fallback',
    },
    {
      stateMutability: 'payable',
      type: 'receive',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'executer',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint16[2][]',
          name: 'bookings',
          type: 'uint16[2][]',
        },
      ],
      name: 'BookingCheckedIn',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'executer',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint16[2][]',
          name: 'bookings',
          type: 'uint16[2][]',
        },
      ],
      name: 'BookingConfirmed',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint16[2][]',
          name: 'bookings',
          type: 'uint16[2][]',
        },
      ],
      name: 'CanceledBookings',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint16[2][]',
          name: 'bookings',
          type: 'uint16[2][]',
        },
      ],
      name: 'NewBookings',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'leapYear',
          type: 'bool',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'start',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'end',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'enabled',
          type: 'bool',
        },
      ],
      name: 'YearAdded',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
      ],
      name: 'YearRemoved',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'leapYear',
          type: 'bool',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'start',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'end',
          type: 'uint256',
        },
        {
          indexed: false,
          internalType: 'bool',
          name: 'enabled',
          type: 'bool',
        },
      ],
      name: 'YearUpdated',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
        {
          internalType: 'bool',
          name: 'leapYear',
          type: 'bool',
        },
        {
          internalType: 'uint256',
          name: 'start',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'end',
          type: 'uint256',
        },
        {
          internalType: 'bool',
          name: 'enabled',
          type: 'bool',
        },
      ],
      name: 'addAccommodationYear',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16[2][]',
          name: 'dates',
          type: 'uint16[2][]',
        },
        {
          internalType: 'uint256',
          name: 'price',
          type: 'uint256',
        },
      ],
      name: 'bookAccommodation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16[2][]',
          name: 'dates',
          type: 'uint16[2][]',
        },
      ],
      name: 'cancelAccommodation',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16[2][]',
          name: 'dates',
          type: 'uint16[2][]',
        },
      ],
      name: 'cancelAccommodationFor',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account_',
          type: 'address',
        },
      ],
      name: 'checkedInNightsByYearFor',
      outputs: [
        {
          internalType: 'uint16[2][]',
          name: '',
          type: 'uint16[2][]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16[2][]',
          name: 'dates',
          type: 'uint16[2][]',
        },
      ],
      name: 'checkinAccommodationFor',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16[2][]',
          name: 'dates',
          type: 'uint16[2][]',
        },
      ],
      name: 'confirmAccommodationFor',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
        {
          internalType: 'bool',
          name: 'enable',
          type: 'bool',
        },
      ],
      name: 'enableAccommodationYear',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16',
          name: 'yearNum',
          type: 'uint16',
        },
        {
          internalType: 'uint16',
          name: 'dayOfYear',
          type: 'uint16',
        },
      ],
      name: 'getAccommodationBooking',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
        {
          components: [
            {
              internalType: 'enum BookingMapLib.BookingStatus',
              name: 'status',
              type: 'uint8',
            },
            {
              internalType: 'uint16',
              name: 'year',
              type: 'uint16',
            },
            {
              internalType: 'uint16',
              name: 'dayOfYear',
              type: 'uint16',
            },
            {
              internalType: 'uint256',
              name: 'price',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'timestamp',
              type: 'uint256',
            },
          ],
          internalType: 'struct BookingMapLib.Booking',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16',
          name: '_year',
          type: 'uint16',
        },
      ],
      name: 'getAccommodationBookings',
      outputs: [
        {
          components: [
            {
              internalType: 'enum BookingMapLib.BookingStatus',
              name: 'status',
              type: 'uint8',
            },
            {
              internalType: 'uint16',
              name: 'year',
              type: 'uint16',
            },
            {
              internalType: 'uint16',
              name: 'dayOfYear',
              type: 'uint16',
            },
            {
              internalType: 'uint256',
              name: 'price',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'timestamp',
              type: 'uint256',
            },
          ],
          internalType: 'struct BookingMapLib.Booking[]',
          name: '',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
      ],
      name: 'getAccommodationYear',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
        {
          components: [
            {
              internalType: 'uint16',
              name: 'number',
              type: 'uint16',
            },
            {
              internalType: 'bool',
              name: 'leapYear',
              type: 'bool',
            },
            {
              internalType: 'uint256',
              name: 'start',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'end',
              type: 'uint256',
            },
            {
              internalType: 'bool',
              name: 'enabled',
              type: 'bool',
            },
          ],
          internalType: 'struct BookingMapLib.Year',
          name: '',
          type: 'tuple',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getAccommodationYears',
      outputs: [
        {
          components: [
            {
              internalType: 'uint16',
              name: 'number',
              type: 'uint16',
            },
            {
              internalType: 'bool',
              name: 'leapYear',
              type: 'bool',
            },
            {
              internalType: 'uint256',
              name: 'start',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'end',
              type: 'uint256',
            },
            {
              internalType: 'bool',
              name: 'enabled',
              type: 'bool',
            },
          ],
          internalType: 'struct BookingMapLib.Year[]',
          name: '',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16',
          name: 'year',
          type: 'uint16',
        },
        {
          internalType: 'uint16',
          name: 'day',
          type: 'uint16',
        },
      ],
      name: 'lockedStakeAt',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
      ],
      name: 'removeAccommodationYear',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint16',
          name: 'year',
          type: 'uint16',
        },
        {
          internalType: 'uint16',
          name: 'day',
          type: 'uint16',
        },
      ],
      name: 'unlockedStakeAt',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint16',
          name: 'number',
          type: 'uint16',
        },
        {
          internalType: 'bool',
          name: 'leapYear',
          type: 'bool',
        },
        {
          internalType: 'uint256',
          name: 'start',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'end',
          type: 'uint256',
        },
        {
          internalType: 'bool',
          name: 'enabled',
          type: 'bool',
        },
      ],
      name: 'updateAccommodationYear',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'DepositedTokens',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'WithdrawnTokens',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'depositStake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'depositsStakedFor',
      outputs: [
        {
          components: [
            {
              internalType: 'uint256',
              name: 'timestamp',
              type: 'uint256',
            },
            {
              internalType: 'uint256',
              name: 'amount',
              type: 'uint256',
            },
          ],
          internalType: 'struct OrderedStakeLib.Deposit[]',
          name: '',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'lockedStake',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'requestedAmount',
          type: 'uint256',
        },
      ],
      name: 'restake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'restakeMax',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'stakedBalanceOf',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'unlockedStake',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'withdrawMaxStake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'requested',
          type: 'uint256',
        },
      ],
      name: 'withdrawStake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Paused',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'previousAdminRole',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'newAdminRole',
          type: 'bytes32',
        },
      ],
      name: 'RoleAdminChanged',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleGranted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'sender',
          type: 'address',
        },
      ],
      name: 'RoleRevoked',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Unpaused',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
      ],
      name: 'getRoleAdmin',
      outputs: [
        {
          internalType: 'bytes32',
          name: '',
          type: 'bytes32',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'getRoles',
      outputs: [
        {
          internalType: 'string[2][5]',
          name: '',
          type: 'string[2][5]',
        },
      ],
      stateMutability: 'pure',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'grantRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'hasRole',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'from',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      name: 'isTokenTransferPermitted',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'mintCommunityTokenTo',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'paused',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'renounceRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'revokeRole',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes32',
          name: 'role',
          type: 'bytes32',
        },
        {
          internalType: 'bytes32',
          name: 'adminRole',
          type: 'bytes32',
        },
      ],
      name: 'setRoleAdmin',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'executer',
          type: 'address',
        },
      ],
      name: 'MemberAdded',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'address',
          name: 'executer',
          type: 'address',
        },
      ],
      name: 'MemberRemoved',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'addMember',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'isMember',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'index_',
          type: 'uint256',
        },
      ],
      name: 'memberAt',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'memberList',
      outputs: [
        {
          internalType: 'address[]',
          name: '',
          type: 'address[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'membersLength',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'removeMember',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_treasury',
          type: 'address',
        },
      ],
      name: 'init',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'facetAddress',
              type: 'address',
            },
            {
              internalType: 'enum IDiamondCut.FacetCutAction',
              name: 'action',
              type: 'uint8',
            },
            {
              internalType: 'bytes4[]',
              name: 'functionSelectors',
              type: 'bytes4[]',
            },
          ],
          indexed: false,
          internalType: 'struct IDiamondCut.FacetCut[]',
          name: '_diamondCut',
          type: 'tuple[]',
        },
        {
          indexed: false,
          internalType: 'address',
          name: '_init',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'bytes',
          name: '_calldata',
          type: 'bytes',
        },
      ],
      name: 'DiamondCut',
      type: 'event',
    },
    {
      inputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'facetAddress',
              type: 'address',
            },
            {
              internalType: 'enum IDiamondCut.FacetCutAction',
              name: 'action',
              type: 'uint8',
            },
            {
              internalType: 'bytes4[]',
              name: 'functionSelectors',
              type: 'bytes4[]',
            },
          ],
          internalType: 'struct IDiamondCut.FacetCut[]',
          name: '_diamondCut',
          type: 'tuple[]',
        },
        {
          internalType: 'address',
          name: '_init',
          type: 'address',
        },
        {
          internalType: 'bytes',
          name: '_calldata',
          type: 'bytes',
        },
      ],
      name: 'diamondCut',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: 'owner_',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'bytes4',
          name: '_functionSelector',
          type: 'bytes4',
        },
      ],
      name: 'facetAddress',
      outputs: [
        {
          internalType: 'address',
          name: 'facetAddress_',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'facetAddresses',
      outputs: [
        {
          internalType: 'address[]',
          name: 'facetAddresses_',
          type: 'address[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_facet',
          type: 'address',
        },
      ],
      name: 'facetFunctionSelectors',
      outputs: [
        {
          internalType: 'bytes4[]',
          name: 'facetFunctionSelectors_',
          type: 'bytes4[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'facets',
      outputs: [
        {
          components: [
            {
              internalType: 'address',
              name: 'facetAddress',
              type: 'address',
            },
            {
              internalType: 'bytes4[]',
              name: 'functionSelectors',
              type: 'bytes4[]',
            },
          ],
          internalType: 'struct IDiamondLoupe.Facet[]',
          name: 'facets_',
          type: 'tuple[]',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI: [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'uint8',
          name: 'version',
          type: 'uint8',
        },
      ],
      name: 'Initialized',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferStarted',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Paused',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'SuccessBuy',
      type: 'event',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: 'address',
          name: 'account',
          type: 'address',
        },
      ],
      name: 'Unpaused',
      type: 'event',
    },
    {
      inputs: [],
      name: 'acceptOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'buy',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'spender',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'to',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'buyFrom',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'calculateCurrentPrice',
      outputs: [
        {
          internalType: 'uint256',
          name: '_currentPrice',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'amount',
          type: 'uint256',
        },
      ],
      name: 'calculateTotalCost',
      outputs: [
        {
          internalType: 'uint256',
          name: 'newPrice',
          type: 'uint256',
        },
        {
          internalType: 'uint256',
          name: 'totalCost',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'currentPrice',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'token_',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'quote_',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'minter_',
          type: 'address',
        },
        {
          internalType: 'address',
          name: 'treasury_',
          type: 'address',
        },
      ],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'minter',
      outputs: [
        {
          internalType: 'contract IMinterDAO',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'paused',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'pendingOwner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'priceCurveMaxValue',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'priceCurveMinValue',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'quote',
      outputs: [
        {
          internalType: 'contract IERC20Upgradeable',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'saleHardCap',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'supply',
          type: 'uint256',
        },
      ],
      name: 'setMaxLiquidSupply',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'newPrice',
          type: 'uint256',
        },
      ],
      name: 'setNewPrice',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'treasury_',
          type: 'address',
        },
      ],
      name: 'setTreasury',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'token',
      outputs: [
        {
          internalType: 'contract IERC20Upgradeable',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'treasury',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'unpause',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
};
