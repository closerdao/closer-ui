import { PropsWithChildren } from 'react';

import { act, renderHook } from '@testing-library/react';
import { utils } from 'ethers';

import { allNetworkConfigs } from '../../config_blockchain';
import { ConfigProvider } from '../../contexts/config';
import { WalletState } from '../../contexts/wallet';
import { useBuyTokens } from '../useBuyTokens';

const sendTransaction = jest.fn();

jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    Contract: function (address: string, abi: any) {
      return {
        address,
        interface: new actual.utils.Interface(abi),
        signer: { sendTransaction },
      };
    },
  };
});

describe('token purchase transaction fees', () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();
  const config = allNetworkConfigs.celoSepolia;
  const wrapper = ({ children }: PropsWithChildren) => (
    <ConfigProvider config={config}>
      <WalletState.Provider
        value={{
          account: '0x0000000000000000000000000000000000000001',
          library: { getUncheckedSigner: () => ({ sendTransaction }) },
        }}
      >
        {children}
      </WalletState.Provider>
    </ConfigProvider>
  );

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    sendTransaction.mockReset().mockResolvedValue({
      hash: '0x1234',
      wait: jest.fn(async () => ({ status: 1, transactionHash: '0x1234' })),
    });
    global.fetch = fetchMock;
    fetchMock.mockReset().mockImplementation(async (_, request) => ({
      ok: true,
      json: async () => ({
        result:
          JSON.parse(request.body).method === 'eth_maxPriorityFeePerGas'
            ? '0x9502f900'
            : { baseFeePerGas: '0xba43b7400' },
      }),
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('adds fees to both approval and purchase, preserving calldata and wallet gas estimation', async () => {
    const { result } = renderHook(() => useBuyTokens(), { wrapper });
    await act(async () => {
      expect(
        (
          await result.current.approveCeurWei(
            utils.parseEther('100').toString(),
          )
        ).success,
      ).toBe(true);
      expect((await result.current.buyTokens('5')).success).toBe(true);
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(
      fetchMock.mock.calls.every(([url]) => url === config.BLOCKCHAIN_RPC_URL),
    ).toBe(true);
    expect(sendTransaction).toHaveBeenCalledTimes(2);
    const [approval, purchase] = sendTransaction.mock.calls.map(([tx]) => tx);
    expect(approval.to).toBe(config.CEUR_TOKEN_ADDRESS);
    expect(approval.data).toBe(
      new utils.Interface(config.BLOCKCHAIN_DAO_TOKEN_ABI).encodeFunctionData(
        'approve',
        [
          config.BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS,
          utils.parseEther('105'),
        ],
      ),
    );
    expect(purchase.to).toBe(config.BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ADDRESS);
    expect(purchase.data).toBe(
      new utils.Interface(
        config.BLOCKCHAIN_DYNAMIC_SALE_CONTRACT_ABI,
      ).encodeFunctionData('buy', [utils.parseEther('5')]),
    );
    for (const tx of [approval, purchase]) {
      expect(tx.maxPriorityFeePerGas.toString()).toBe('2500000000');
      expect(tx.maxFeePerGas.toString()).toBe('102500000000');
      expect(tx.gasPrice).toBeUndefined();
      expect(tx.gasLimit).toBeUndefined();
    }
  });

  it('omits fees when RPC estimation fails', async () => {
    fetchMock.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useBuyTokens(), { wrapper });
    await act(async () => {
      expect(
        (
          await result.current.approveCeurWei(
            utils.parseEther('100').toString(),
          )
        ).success,
      ).toBe(true);
      expect((await result.current.buyTokens('5')).success).toBe(true);
    });
    for (const [tx] of sendTransaction.mock.calls) {
      expect(Object.keys(tx).sort()).toEqual(['data', 'to']);
    }
  });

  it('returns a wallet submission error without retrying the transaction', async () => {
    const rejected = Object.assign(new Error('User rejected'), { code: 4001 });
    sendTransaction.mockRejectedValue(rejected);
    const { result } = renderHook(() => useBuyTokens(), { wrapper });
    await act(async () => {
      expect(await result.current.buyTokens('5')).toMatchObject({
        success: false,
        error: rejected,
      });
    });
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });
});
