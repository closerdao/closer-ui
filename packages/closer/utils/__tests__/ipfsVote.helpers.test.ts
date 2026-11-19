import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { buildVotePayload, publishVoteToIPFS } from '../ipfsVote.helpers';

describe('buildVotePayload', () => {
  it('carries proposal id, choice and weight, and stamps an ISO-8601 votedAt', () => {
    const payload = buildVotePayload('proposal-24', 'yes', 12.5);

    expect(payload.proposalId).toBe('proposal-24');
    expect(payload.vote).toBe('yes');
    expect(payload.weight).toBe(12.5);
    expect(() => new Date(payload.votedAt).toISOString()).not.toThrow();
    expect(new Date(payload.votedAt).toISOString()).toBe(payload.votedAt);
  });
});

describe('publishVoteToIPFS', () => {
  const originalEndpoint = process.env.IPFS_PINNING_ENDPOINT;
  const originalToken = process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.IPFS_PINNING_ENDPOINT = originalEndpoint;
    process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN = originalToken;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const payload = buildVotePayload('proposal-24', 'no', 4);

  it('never throws, and reports unconfigured when no provider is set', async () => {
    delete process.env.IPFS_PINNING_ENDPOINT;
    delete process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN;

    const result = await publishVoteToIPFS(payload, '0xsig', '0xvoter');

    expect(result).toEqual({
      published: false,
      reason: 'ipfs_not_configured',
    });
  });

  it('returns a CID and gateway URL on a successful publish', async () => {
    process.env.IPFS_PINNING_ENDPOINT = 'https://pin.example/upload';
    process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN = 'test-token';

    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ cid: 'bafy-test-cid' }),
    })) as unknown as typeof fetch;
    global.fetch = fetchMock;

    const result = await publishVoteToIPFS(payload, '0xsig', '0xvoter');

    expect(result).toEqual({
      published: true,
      cid: 'bafy-test-cid',
      gatewayUrl: 'https://ipfs.io/ipfs/bafy-test-cid',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://pin.example/upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('is non-blocking on an HTTP error from the provider', async () => {
    process.env.IPFS_PINNING_ENDPOINT = 'https://pin.example/upload';
    process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN = 'test-token';

    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const result = await publishVoteToIPFS(payload, '0xsig', '0xvoter');

    expect(result).toEqual({ published: false, reason: 'ipfs_http_503' });
  });

  it('is non-blocking when the network request itself fails', async () => {
    process.env.IPFS_PINNING_ENDPOINT = 'https://pin.example/upload';
    process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN = 'test-token';

    global.fetch = jest.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;

    const result = await publishVoteToIPFS(payload, '0xsig', '0xvoter');

    expect(result).toEqual({ published: false, reason: 'network down' });
  });

  it('treats a response missing a cid as a non-fatal failure', async () => {
    process.env.IPFS_PINNING_ENDPOINT = 'https://pin.example/upload';
    process.env.NEXT_PUBLIC_IPFS_PINNING_TOKEN = 'test-token';

    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const result = await publishVoteToIPFS(payload, '0xsig', '0xvoter');

    expect(result).toEqual({ published: false, reason: 'ipfs_missing_cid' });
  });
});
