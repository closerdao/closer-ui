import { utils } from 'ethers';

import { blockchainConfig } from '../config_blockchain';
import { sendDAOToken } from './blockchain';
import { transferDonationStablecoin } from './donationStablecoinTransfer';

// Keep real ethers Contract population and calldata encoding. Only the signer
// and the public RPC are substituted; no transaction leaves this test.
describe('token transfer transaction fees', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  const to = '0x0000000000000000000000000000000000000002';
  const sendTransaction = jest.fn();
  const signer = {
    _isSigner: true,
    getAddress: async () => '0x0000000000000000000000000000000000000001',
    resolveName: async (address: string) => address,
    sendTransaction,
  };
  const library: any = { getSigner: () => signer };

  beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset().mockImplementation(async (_, request) => ({
      ok: true,
      json: async () => ({
        result:
          JSON.parse(request.body).method === 'eth_maxPriorityFeePerGas'
            ? '0x9502f900'
            : { baseFeePerGas: '0x2e90edd000' },
      }),
    }));
    sendTransaction.mockReset().mockResolvedValue({
      hash: '0x1234',
      wait: jest.fn(async () => ({
        status: 1,
        transactionHash: '0x1234',
        logs: [],
      })),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const transfer = async (kind: string) =>
    kind === 'DAO token'
      ? sendDAOToken(library, to, utils.parseEther('1.25'))
      : transferDonationStablecoin({
          library,
          tokenAddress: blockchainConfig.CEUR_TOKEN_ADDRESS,
          to,
          humanAmount: 1.25,
        });

  it.each(['DAO token', 'stablecoin'])(
    'supplies RPC fees for a %s transfer',
    async (kind) => {
      await transfer(kind);
      expect(sendTransaction).toHaveBeenCalledTimes(1);
      const tx = sendTransaction.mock.calls[0][0];
      expect(tx.maxPriorityFeePerGas.toString()).toBe('2500000000');
      expect(tx.maxFeePerGas.toString()).toBe('402500000000');
      const iface = new utils.Interface([
        'function transfer(address to, uint256 amount)',
      ]);
      expect(tx.data).toBe(
        iface.encodeFunctionData('transfer', [to, utils.parseEther('1.25')]),
      );
      expect(tx.to.toLowerCase()).toBe(
        (kind === 'DAO token'
          ? blockchainConfig.BLOCKCHAIN_DAO_TOKEN.address
          : blockchainConfig.CEUR_TOKEN_ADDRESS
        ).toLowerCase(),
      );
      expect(tx.gasLimit).toBeUndefined();
      expect(tx.gasPrice).toBeUndefined();
    },
  );

  it.each(['DAO token', 'stablecoin'])(
    'lets the wallet estimate fees for a %s transfer when RPC fails',
    async (kind) => {
      fetchMock.mockRejectedValue(new Error('Offline'));
      await transfer(kind);
      expect(sendTransaction).toHaveBeenCalledTimes(1);
      const tx = sendTransaction.mock.calls[0][0];
      expect(tx.maxPriorityFeePerGas).toBeUndefined();
      expect(tx.maxFeePerGas).toBeUndefined();
    },
  );

  it.each(['DAO token', 'stablecoin'])(
    'propagates a %s wallet rejection without resubmitting',
    async (kind) => {
      const rejected = Object.assign(new Error('User rejected'), {
        code: 4001,
      });
      sendTransaction.mockRejectedValue(rejected);
      await expect(transfer(kind)).rejects.toBe(rejected);
      expect(sendTransaction).toHaveBeenCalledTimes(1);
    },
  );
});
