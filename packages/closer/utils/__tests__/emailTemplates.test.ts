import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  fetchEmailTemplateVariables,
  fetchEmailTemplates,
  renderEmailTemplate,
  updateEmailTemplate,
} from '../emailTemplates';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn(), post: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    emailTemplate: {
      list: { query: jest.fn() },
      variables: { query: jest.fn() },
      update: { mutate: jest.fn() },
      render: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  patch: jest.Mock;
  post: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const et = trpc.emailTemplate as unknown as {
  list: { query: jest.Mock };
  variables: { query: jest.Mock };
  update: { mutate: jest.Mock };
  render: { mutate: jest.Mock };
};

const welcome = { slug: 'welcome', name: 'Welcome' };
const trpcError = () =>
  new TRPCClientError('Email template not found: nope', {
    result: {
      error: {
        message: 'Email template not found: nope',
        code: -32004,
        data: { code: 'NOT_FOUND', httpStatus: 404 },
      },
    },
  } as never);

beforeEach(() => jest.resetAllMocks());

describe('fetchEmailTemplates', () => {
  it('reads the legacy route', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValue({ data: { results: [welcome] } });
    expect(await fetchEmailTemplates(100)).toEqual([welcome]);
    expect(mockedApi.get).toHaveBeenCalledWith('/emailtemplates?limit=100');
  });

  it('calls emailTemplate.list and maps errors', async () => {
    mockedEnabled.mockReturnValue(true);
    et.list.query.mockResolvedValueOnce([welcome]);
    expect(await fetchEmailTemplates(100)).toEqual([welcome]);
    expect(et.list.query).toHaveBeenCalledWith({ limit: 100 });
    et.list.query.mockRejectedValueOnce(trpcError());
    const err = await fetchEmailTemplates(100).catch((e) => e);
    expect(parseMessageFromError(err)).toBe('Email template not found: nope');
  });
});

describe('fetchEmailTemplateVariables', () => {
  it('reads the legacy route and swallows a failure', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.get.mockResolvedValueOnce({ data: { results: ['a'] } });
    expect(await fetchEmailTemplateVariables()).toEqual(['a']);
    mockedApi.get.mockRejectedValueOnce(new Error('x'));
    expect(await fetchEmailTemplateVariables()).toEqual([]);
  });

  it('calls emailTemplate.variables and swallows a failure', async () => {
    mockedEnabled.mockReturnValue(true);
    et.variables.query.mockResolvedValueOnce(['a']);
    expect(await fetchEmailTemplateVariables()).toEqual(['a']);
    et.variables.query.mockRejectedValueOnce(trpcError());
    expect(await fetchEmailTemplateVariables()).toEqual([]);
  });
});

describe('updateEmailTemplate', () => {
  it('patches the legacy route', async () => {
    mockedEnabled.mockReturnValue(false);
    await updateEmailTemplate('welcome', { name: 'W' });
    expect(mockedApi.patch).toHaveBeenCalledWith('/emailtemplate/welcome', {
      name: 'W',
    });
  });

  it('calls emailTemplate.update and maps errors', async () => {
    mockedEnabled.mockReturnValue(true);
    et.update.mutate.mockResolvedValueOnce({});
    await updateEmailTemplate('welcome', { name: 'W' });
    expect(et.update.mutate).toHaveBeenCalledWith({
      idOrSlug: 'welcome',
      data: { name: 'W' },
    });
    et.update.mutate.mockRejectedValueOnce(trpcError());
    const err = await updateEmailTemplate('welcome', {}).catch((e) => e);
    expect(parseMessageFromError(err)).toBe('Email template not found: nope');
  });
});

describe('renderEmailTemplate', () => {
  it('posts the legacy route, with and without sendToMe', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { html: '<p>x</p>' } });
    expect(await renderEmailTemplate('welcome', { a: 1 }, false)).toBe(
      '<p>x</p>',
    );
    expect(mockedApi.post).toHaveBeenLastCalledWith('/emails/render/welcome', {
      templateData: { a: 1 },
    });
    await renderEmailTemplate('welcome', { a: 1 }, true);
    expect(mockedApi.post).toHaveBeenLastCalledWith('/emails/render/welcome', {
      templateData: { a: 1 },
      sendToMe: true,
    });
  });

  it('calls emailTemplate.render and maps errors', async () => {
    mockedEnabled.mockReturnValue(true);
    et.render.mutate.mockResolvedValueOnce({ html: '<p>y</p>' });
    expect(await renderEmailTemplate('welcome', { a: 1 }, true)).toBe(
      '<p>y</p>',
    );
    expect(et.render.mutate).toHaveBeenCalledWith({
      templateId: 'welcome',
      templateData: { a: 1 },
      sendToMe: true,
    });
    et.render.mutate.mockRejectedValueOnce(trpcError());
    const err = await renderEmailTemplate('x', {}, false).catch((e) => e);
    expect(parseMessageFromError(err)).toBe('Email template not found: nope');
  });
});
