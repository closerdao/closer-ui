import { TRPCClientError } from '@trpc/client';

import { getErrorStatus } from '../agentChat.helpers';
import api from '../api';
import { postAgentChat, postReportIssue, triggerDeploy } from '../hubEndpoints';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    agent: { chat: { mutate: jest.fn() } },
    support: { reportIssue: { mutate: jest.fn() } },
    deploy: { trigger: { mutate: jest.fn() } },
  },
}));

const mockedApi = api as unknown as { post: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const t = trpc as unknown as Record<
  string,
  Record<string, { mutate: jest.Mock }>
>;

beforeEach(() => jest.clearAllMocks());

describe('postAgentChat', () => {
  it('posts to legacy when the group is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { ok: 1 } });
    expect(await postAgentChat({ content: 'hi', room: 'r' })).toEqual({
      ok: 1,
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/agent/chat', {
      content: 'hi',
      room: 'r',
    });
    expect(mockedEnabled).toHaveBeenCalledWith('9.5a');
  });

  it('calls agent.chat when the group is on', async () => {
    mockedEnabled.mockReturnValue(true);
    t.agent.chat.mutate.mockResolvedValue({ ok: 2 });
    expect(await postAgentChat({ content: 'hi' })).toEqual({ ok: 2 });
    expect(t.agent.chat.mutate).toHaveBeenCalledWith({ content: 'hi' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it.each([
    ['UNAUTHORIZED', 401],
    ['FORBIDDEN', 403],
  ])('keeps the %s status on the rejected error', async (code, httpStatus) => {
    mockedEnabled.mockReturnValue(true);
    t.agent.chat.mutate.mockRejectedValue(
      new TRPCClientError('nope', {
        result: { error: { message: 'nope', data: { code, httpStatus } } },
      } as never),
    );
    const err = await postAgentChat({ content: 'hi' }).catch((e) => e);
    expect(getErrorStatus(err)).toBe(httpStatus);
  });

  it('rejects with an api error when the procedure fails', async () => {
    mockedEnabled.mockReturnValue(true);
    t.agent.chat.mutate.mockRejectedValue(new Error('boom'));
    await expect(postAgentChat({ content: 'hi' })).rejects.toBeDefined();
  });
});

describe('postReportIssue', () => {
  const body = { message: 'm', userEmail: 'a@b.c' };

  it('posts to legacy when the group is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({});
    await postReportIssue(body);
    expect(mockedApi.post).toHaveBeenCalledWith('/report-issue', body);
  });

  it('calls support.reportIssue when the group is on', async () => {
    mockedEnabled.mockReturnValue(true);
    t.support.reportIssue.mutate.mockResolvedValue({});
    await postReportIssue(body);
    expect(t.support.reportIssue.mutate).toHaveBeenCalledWith(body);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('triggerDeploy', () => {
  it('posts to legacy when the group is off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({});
    await triggerDeploy();
    expect(mockedApi.post).toHaveBeenCalledWith('/deploy', {});
  });

  it('calls deploy.trigger when the group is on', async () => {
    mockedEnabled.mockReturnValue(true);
    t.deploy.trigger.mutate.mockResolvedValue({});
    await triggerDeploy();
    expect(t.deploy.trigger.mutate).toHaveBeenCalledWith({});
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
