import { act, renderHook } from '@testing-library/react';
import { TRPCClientError } from '@trpc/client';
import { fromJS } from 'immutable';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  createPageRecord,
  deletePageRecord,
  editPage,
  fetchPageRecordById,
  fetchPageRecordBySlug,
  fetchPages,
  generatePage,
  publishPage,
  updatePageRecord,
  useEditorPages,
} from '../pages';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    page: {
      bySlug: { query: jest.fn() },
      list: { query: jest.fn() },
      get: { query: jest.fn() },
      create: { mutate: jest.fn() },
      update: { mutate: jest.fn() },
      remove: { mutate: jest.fn() },
      generate: { mutate: jest.fn() },
      edit: { mutate: jest.fn() },
      publish: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  delete: jest.Mock;
};
const mockedEnabled = isTrpcEnabled as jest.Mock;
const page = trpc.page as unknown as {
  bySlug: { query: jest.Mock };
  list: { query: jest.Mock };
  get: { query: jest.Mock };
  create: { mutate: jest.Mock };
  update: { mutate: jest.Mock };
  remove: { mutate: jest.Mock };
  generate: { mutate: jest.Mock };
  edit: { mutate: jest.Mock };
  publish: { mutate: jest.Mock };
};

const about = { _id: 'p1', slug: '/about', title: 'About' };
const press = { _id: 'p2', slug: '/press', title: 'Press' };

const makePlatform = () => ({
  page: {
    find: jest.fn(),
    get: jest.fn().mockResolvedValue(undefined),
    post: jest.fn(),
    patch: jest.fn(),
    generate: jest.fn(),
  },
});

const trpcError = (message: string, code: string, httpStatus: number) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('on the legacy API', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(false));

  it('makes the GET /page slug lookups it replaced', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [about] } });

    await expect(
      fetchPageRecordBySlug('/about', { cache: false }),
    ).resolves.toEqual(about);
    await fetchPageRecordBySlug('/about');

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/page', {
      params: { where: { slug: '/about' }, limit: 1 },
      cache: false,
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/page', {
      params: { where: { slug: '/about' }, limit: 1 },
    });
    expect(page.bySlug.query).not.toHaveBeenCalled();
  });

  it('answers null for an empty slug lookup', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [] } });

    await expect(fetchPageRecordBySlug('/nope')).resolves.toBeNull();
  });

  it('reads by id uncached and lists with only a limit', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { results: about } });
    mockedApi.get.mockResolvedValueOnce({ data: { results: [about, {}] } });

    await expect(fetchPageRecordById('p1')).resolves.toEqual(about);
    await expect(fetchPages(200, { cache: false })).resolves.toEqual([
      about,
      {},
    ]);

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, '/page/p1', {
      cache: false,
    });
    expect(mockedApi.get).toHaveBeenNthCalledWith(2, '/page', {
      params: { limit: 200 },
      cache: false,
    });
  });

  it('writes through the platform store and unwraps its results', async () => {
    const platform = makePlatform();
    platform.page.post.mockResolvedValue({ results: fromJS(about) });
    platform.page.patch.mockResolvedValue(undefined);

    await expect(
      createPageRecord(platform, { title: 'About' }),
    ).resolves.toEqual(about);
    await expect(
      updatePageRecord(platform, 'p1', { title: 'About' }),
    ).resolves.toBeUndefined();

    expect(platform.page.post).toHaveBeenCalledWith({ title: 'About' });
    expect(platform.page.patch).toHaveBeenCalledWith('p1', { title: 'About' });
    expect(page.create.mutate).not.toHaveBeenCalled();
  });

  it('deletes with DELETE /page/:id', async () => {
    mockedApi.delete.mockResolvedValue({});

    await deletePageRecord('p1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/page/p1');
  });

  it('generates through the store and hands back its action', async () => {
    const platform = makePlatform();
    const action = { results: fromJS(about) };
    platform.page.generate.mockResolvedValue(action);

    await expect(generatePage(platform, 'An about page')).resolves.toBe(action);
    expect(platform.page.generate).toHaveBeenCalledWith({
      prompt: 'An about page',
    });
    expect(page.generate.mutate).not.toHaveBeenCalled();
  });

  it('edits and publishes with the POSTs and bodies it replaced', async () => {
    const localization = { locales: ['pl'], errors: { pl: 'boom' } };
    mockedApi.post.mockResolvedValueOnce({ data: { results: about } });
    mockedApi.post.mockResolvedValueOnce({
      data: { results: about, localization },
    });
    mockedApi.post.mockResolvedValueOnce({ data: { results: about } });

    await expect(editPage('p1', 'Shorter')).resolves.toEqual({
      results: about,
    });
    await expect(
      publishPage('p1', { locales: ['pl'], localize: true }),
    ).resolves.toEqual({ results: about, localization });
    await publishPage('p1', { localize: false, locales: [] });

    expect(mockedApi.post).toHaveBeenNthCalledWith(1, '/pages/p1/edit', {
      prompt: 'Shorter',
    });
    expect(mockedApi.post).toHaveBeenNthCalledWith(2, '/pages/p1/publish', {
      locales: ['pl'],
      localize: true,
    });
    expect(JSON.stringify(mockedApi.post.mock.calls[2][1])).toBe(
      '{"localize":false,"locales":[]}',
    );
    expect(page.edit.mutate).not.toHaveBeenCalled();
    expect(page.publish.mutate).not.toHaveBeenCalled();
  });

  it('reads the editor list from the store and loads it there', async () => {
    const platform = makePlatform();
    platform.page.find.mockReturnValue(fromJS([about]));
    const { result } = renderHook(() => useEditorPages(platform));

    expect(result.current.pages).toEqual([about]);
    await act(() => result.current.refresh({ force: true }));
    await act(() => result.current.refresh());

    expect(platform.page.find).toHaveBeenCalledWith({ limit: 200 });
    expect(platform.page.get).toHaveBeenNthCalledWith(
      1,
      { limit: 200 },
      { force: true },
    );
    expect(platform.page.get).toHaveBeenNthCalledWith(
      2,
      { limit: 200 },
      undefined,
    );
    expect(page.list.query).not.toHaveBeenCalled();
  });
});

describe('on tRPC', () => {
  beforeEach(() => mockedEnabled.mockReturnValue(true));

  it('looks a slug up with page.bySlug', async () => {
    page.bySlug.query.mockResolvedValue(null);

    await expect(
      fetchPageRecordBySlug('/about', { cache: false }),
    ).resolves.toBeNull();
    expect(page.bySlug.query).toHaveBeenCalledWith({ slug: '/about' });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads by id and lists in the default order', async () => {
    page.get.query.mockResolvedValue(about);
    page.list.query.mockResolvedValue([about, {}]);

    await expect(fetchPageRecordById('p1')).resolves.toEqual(about);
    await expect(fetchPages(500)).resolves.toEqual([about, {}]);

    expect(page.get.query).toHaveBeenCalledWith({ id: 'p1' });
    expect(page.list.query).toHaveBeenCalledWith({ limit: 500 });
  });

  it('creates, updates and removes without the store', async () => {
    const platform = makePlatform();
    page.create.mutate.mockResolvedValue(about);
    page.update.mutate.mockResolvedValue(about);
    page.remove.mutate.mockResolvedValue({ deleted: true });

    await expect(createPageRecord(platform, { title: 'About' })).resolves.toBe(
      about,
    );
    await updatePageRecord(platform, 'p1', { title: 'About' });
    await deletePageRecord('p1');

    expect(page.create.mutate).toHaveBeenCalledWith({ title: 'About' });
    expect(page.update.mutate).toHaveBeenCalledWith({
      id: 'p1',
      data: { title: 'About' },
    });
    expect(page.remove.mutate).toHaveBeenCalledWith({ id: 'p1' });
    expect(platform.page.post).not.toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });

  it('rejects a failed write with the API error parseMessageFromError reads', async () => {
    page.update.mutate.mockRejectedValue(
      new TRPCClientError('Duplicate entry.', {
        result: {
          error: {
            message: 'Duplicate entry.',
            code: -32600,
            data: { code: 'BAD_REQUEST', httpStatus: 400, zodError: null },
          },
        },
      }),
    );

    await expect(
      updatePageRecord(makePlatform(), 'p1', {}),
    ).rejects.toMatchObject({
      message: 'Duplicate entry.',
      response: { status: 400, data: { error: 'Duplicate entry.' } },
    });
  });

  it('adapts generate, edit and publish to the results shape', async () => {
    const platform = makePlatform();
    const localization = { locales: ['pl'], errors: {} };
    page.generate.mutate.mockResolvedValue(about);
    page.edit.mutate.mockResolvedValue(about);
    page.publish.mutate.mockResolvedValue({ page: about, localization });

    await expect(generatePage(platform, 'An about page')).resolves.toEqual({
      results: about,
    });
    await expect(editPage('p1', 'Shorter')).resolves.toEqual({
      results: about,
    });
    await expect(
      publishPage('p1', { locales: ['pl'], localize: true }),
    ).resolves.toEqual({ results: about, localization });

    expect(page.generate.mutate).toHaveBeenCalledWith({
      prompt: 'An about page',
    });
    expect(page.edit.mutate).toHaveBeenCalledWith({
      id: 'p1',
      prompt: 'Shorter',
    });
    expect(page.publish.mutate).toHaveBeenCalledWith({
      id: 'p1',
      locales: ['pl'],
      localize: true,
    });
    expect(platform.page.generate).not.toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('shows a non-editor the 401 Unauthorized legacy answered', async () => {
    page.edit.mutate.mockRejectedValue(
      trpcError('FORBIDDEN', 'FORBIDDEN', 403),
    );

    const error = await editPage('p1', 'Shorter').catch((e) => e);

    expect(error).toMatchObject({
      response: { status: 401, data: { error: 'Unauthorized' } },
    });
    expect(parseMessageFromError(error)).toBe('Unauthorized');
  });

  it('keeps the validation text formatPageSaveError splits, despite its zodError', async () => {
    const message = 'Page validation failed: sections.0.type: Invalid option';
    page.generate.mutate.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32600,
            data: {
              code: 'BAD_REQUEST',
              httpStatus: 400,
              zodError: { formErrors: [], fieldErrors: { sections: ['x'] } },
            },
          },
        },
      }),
    );

    const error = await generatePage(makePlatform(), 'x').catch((e) => e);

    expect(error).toMatchObject({
      response: { status: 400, data: { error: message } },
    });
  });

  it('passes the missing-key and model errors through as the API wrote them', async () => {
    page.generate.mutate.mockRejectedValue(
      trpcError(
        'ANTHROPIC_API_KEY is not configured.',
        'PRECONDITION_FAILED',
        412,
      ),
    );
    page.publish.mutate.mockRejectedValue(
      trpcError('Model request failed: overloaded', 'BAD_GATEWAY', 502),
    );

    const missingKey = await generatePage(makePlatform(), 'x').catch((e) => e);
    const upstream = await publishPage('p1', {
      locales: [],
      localize: true,
    }).catch((e) => e);

    expect(parseMessageFromError(missingKey)).toBe(
      'ANTHROPIC_API_KEY is not configured.',
    );
    expect(parseMessageFromError(upstream)).toBe(
      'Model request failed: overloaded',
    );
  });

  it('keeps the editor list in local state, newest first, across mounts', async () => {
    const platform = makePlatform();
    page.list.query.mockResolvedValue([about, press]);
    const first = renderHook(() => useEditorPages(platform));

    expect(first.result.current.pages).toBeNull();
    await act(() => first.result.current.refresh());

    expect(page.list.query).toHaveBeenCalledWith({
      limit: 200,
      sortBy: '-created',
    });
    expect(first.result.current.pages).toEqual([about, press]);
    expect(platform.page.get).not.toHaveBeenCalled();
    first.unmount();

    const second = renderHook(() => useEditorPages(platform));
    expect(second.result.current.pages).toEqual([about, press]);
  });

  it('keeps the previous list when a refresh fails', async () => {
    page.list.query.mockResolvedValueOnce([about, press]);
    page.list.query.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderHook(() => useEditorPages(makePlatform()));

    await act(() => result.current.refresh());
    await act(() => result.current.refresh({ force: true }));

    expect(result.current.pages).toEqual([about, press]);
  });

  it('swaps an updated page into the list, as the store does', async () => {
    const renamed = { ...about, title: 'About us' };
    page.list.query.mockResolvedValue([about, press]);
    page.update.mutate.mockResolvedValue(renamed);
    const { result } = renderHook(() => useEditorPages(makePlatform()));

    await act(() => result.current.refresh());
    await act(async () => {
      await result.current.update('p1', { title: 'About us' });
    });

    expect(result.current.pages).toEqual([renamed, press]);
  });
});
