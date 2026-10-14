import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';

import api from '../../../utils/api';
import { PlatformProvider, usePlatform } from '../platform';
import * as constants from '../platformActions';

const mockedApi = {
  get: jest.spyOn(api, 'get'),
  patch: jest.spyOn(api, 'patch'),
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PlatformProvider>{children}</PlatformProvider>
);

const renderPlatform = () =>
  renderHook(() => usePlatform().platform, { wrapper });

const ada = { _id: 'u1', screenname: 'Ada' };

beforeEach(() => {
  mockedApi.get.mockReset();
  mockedApi.patch.mockReset();
});

describe('platform store `load`', () => {
  it('stores what get loads where find and findOne read it, without the legacy request', async () => {
    const { result } = renderPlatform();
    const filter = { where: { roles: 'member' } };

    let action: any;
    await act(async () => {
      action = await result.current.user.get(filter, {
        load: () => Promise.resolve([ada]),
      });
    });

    expect(action.type).toBe(constants.GET_SUCCESS);
    expect(result.current.user.find(filter).toJS()).toEqual([ada]);
    expect(result.current.user.findOne('u1').toJS()).toEqual(ada);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('resolves a failed load as a failed request: nothing, the error kept', async () => {
    const { result } = renderPlatform();
    const error = new Error('Invalid input');

    let action: any;
    await act(async () => {
      action = await result.current.user.get(
        {},
        { load: () => Promise.reject(error) },
      );
    });

    expect(action).toBeUndefined();
    expect(result.current.user.areLoading({})).toBe(false);
    expect(result.current.toJS().user.byFilter['{}'].error).toBe(error);
  });

  it('stores what getCount and getOne load', async () => {
    const { result } = renderPlatform();
    const filter = { where: { roles: 'member' } };

    await act(async () => {
      await result.current.user.getCount(filter, {
        load: () => Promise.resolve(7),
      });
      await result.current.user.getOne('ada', {
        load: () => Promise.resolve(ada),
      });
    });

    expect(result.current.user.findCount(filter)).toBe(7);
    expect(result.current.user.findOne('ada').toJS()).toEqual(ada);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('applies what patch loads to the stored user', async () => {
    const { result } = renderPlatform();

    let action: any;
    await act(async () => {
      action = await result.current.user.patch(
        'u1',
        { screenname: 'Ada L' },
        { load: () => Promise.resolve({ ...ada, screenname: 'Ada L' }) },
      );
    });

    expect(action.type).toBe(constants.PATCH_SUCCESS);
    expect(result.current.user.findOne('u1').get('screenname')).toBe('Ada L');
    expect(mockedApi.patch).not.toHaveBeenCalled();
  });

  it('sends the legacy request without a load', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [ada] } } as any);
    const { result } = renderPlatform();

    await act(async () => {
      await result.current.user.get({ limit: 10 });
    });

    expect(mockedApi.get).toHaveBeenCalledWith('/user', {
      params: { sort_by: '-created', limit: 10, where: undefined },
    });
  });
});
