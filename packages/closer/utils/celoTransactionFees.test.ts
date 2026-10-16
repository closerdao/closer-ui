import { BigNumber, constants } from 'ethers';

import { allNetworkConfigs, blockchainConfig } from '../config_blockchain';
import { getCeloTransactionFees } from './celoTransactionFees';

describe('getCeloTransactionFees', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  const reply = (result: unknown) => ({
    ok: true,
    json: async () => ({ jsonrpc: '2.0', id: 1, result }),
  });

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it.each([
    ['mainnet', allNetworkConfigs.celo, '0x2e90edd000', '402500000000'],
    ['Sepolia', allNetworkConfigs.celoSepolia, '0xba43b7400', '102500000000'],
  ])(
    'uses the configured %s RPC and calculates fees in wei',
    async (_, config, baseFee, expectedCap) => {
      fetchMock
        .mockResolvedValueOnce(reply('0x9502f900'))
        .mockResolvedValueOnce(reply({ baseFeePerGas: baseFee }));

      const fees = await getCeloTransactionFees(config);

      expect(fees.maxPriorityFeePerGas?.toString()).toBe('2500000000');
      expect(fees.maxFeePerGas?.toString()).toBe(expectedCap);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(
        fetchMock.mock.calls.map(([url, request]) => ({
          url,
          body: JSON.parse(request.body),
        })),
      ).toEqual([
        {
          url: config.BLOCKCHAIN_RPC_URL,
          body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_maxPriorityFeePerGas',
            params: [],
          },
        },
        {
          url: config.BLOCKCHAIN_RPC_URL,
          body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBlockByNumber',
            params: ['latest', false],
          },
        },
      ]);
    },
  );

  it('defaults to the app network without a fixed priority fee floor or rounding', async () => {
    // Above Number.MAX_SAFE_INTEGER to catch accidental number arithmetic.
    const baseFee = BigNumber.from('9007199254740993');
    fetchMock
      .mockResolvedValueOnce(reply('0x1'))
      .mockResolvedValueOnce(reply({ baseFeePerGas: baseFee.toHexString() }));

    const fees = await getCeloTransactionFees();

    expect(fetchMock.mock.calls[0][0]).toBe(
      blockchainConfig.BLOCKCHAIN_RPC_URL,
    );
    expect(fees.maxPriorityFeePerGas?.toString()).toBe('1');
    expect(fees.maxFeePerGas?.toString()).toBe('18014398509481987');
  });

  it.each([
    ['0x0', { baseFeePerGas: '0x1' }],
    ['0x1', { baseFeePerGas: '0x0' }],
    [null, { baseFeePerGas: '0x1' }],
    ['0x1', null],
    ['0x1', {}],
    ['-0x1', { baseFeePerGas: '0x1' }],
    ['1.5', { baseFeePerGas: '0x1' }],
    [2500000000, { baseFeePerGas: '0x1' }],
    ['0x1', { baseFeePerGas: 'not a fee' }],
    ['0x1', { baseFeePerGas: constants.MaxUint256.toHexString() }],
  ])(
    'omits both fee fields for invalid data (%p, %p)',
    async (priorityFee, block) => {
      fetchMock
        .mockResolvedValueOnce(reply(priorityFee))
        .mockResolvedValueOnce(reply(block));

      expect(await getCeloTransactionFees()).toEqual({});
    },
  );

  it.each([
    { ok: false, status: 503 },
    { ok: true, json: async () => ({ error: { code: -32601 } }) },
    {
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    },
  ])('falls back on an HTTP or RPC error', async (response) => {
    fetchMock.mockResolvedValue(response);
    expect(await getCeloTransactionFees()).toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falls back on a network failure without retrying', async () => {
    fetchMock.mockRejectedValue(new Error('Offline'));
    expect(await getCeloTransactionFees()).toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('aborts a stalled RPC lookup after five seconds and releases the caller', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_, { signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    const pending = getCeloTransactionFees();
    jest.advanceTimersByTime(5000);

    expect(await pending).toEqual({});
    expect(
      fetchMock.mock.calls.every(([, request]) => request.signal.aborted),
    ).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it.each([
    {
      BLOCKCHAIN_NETWORK_ID: 1,
      BLOCKCHAIN_RPC_URL: 'https://ethereum.example',
    },
    { BLOCKCHAIN_NETWORK_ID: 42220 },
    {},
  ])(
    'does not request Celo fees for an unsupported or incomplete config',
    async (config) => {
      expect(await getCeloTransactionFees(config)).toEqual({});
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
