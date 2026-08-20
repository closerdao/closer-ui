import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useState } from 'react';

import { useAuth } from 'closer/contexts/auth';
import { usePlatform } from 'closer/contexts/platform';
import ProposalComments from '../ProposalComments';

jest.mock('closer/contexts/auth', () => ({ useAuth: jest.fn() }));
jest.mock('closer/contexts/platform', () => ({ usePlatform: jest.fn() }));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

const mockedUseAuth = useAuth as unknown as jest.Mock;
const mockedUsePlatform = usePlatform as unknown as jest.Mock;

// Minimal stand-in for the Immutable records the platform store hands back.
const record = (data: Record<string, any>) => ({
  get: (key: string) => data[key],
});

const collection = (items: Record<string, any>[]) =>
  new Map(items.map((item) => [item._id, record(item)]));

const PROPOSAL = { _id: 'proposal-1' } as any;

const COMMENTS = [
  { _id: 'c1', content: 'First comment', createdBy: 'u1', created: '2026-01-01T00:00:00.000Z' },
  { _id: 'c2', content: 'Second comment', createdBy: 'u1', created: '2026-01-02T00:00:00.000Z' },
];

const REPLIES = [
  { _id: 'r1', content: 'Reply one', createdBy: 'u2', created: '2026-01-01T01:00:00.000Z', parentType: 'post', parentId: 'c1' },
  { _id: 'r2', content: 'Reply two', createdBy: 'u2', created: '2026-01-01T02:00:00.000Z', parentType: 'post', parentId: 'c1' },
  { _id: 'r3', content: 'Reply three', createdBy: 'u2', created: '2026-01-02T01:00:00.000Z', parentType: 'post', parentId: 'c2' },
];

const USERS = collection([
  { _id: 'u1', screenname: 'Alice' },
  { _id: 'u2', screenname: 'Bob' },
]);

const buildPlatform = () => {
  const store = new Map<string, Map<string, any>>();
  // The real provider re-renders consumers whenever its reducer stores data;
  // this stands in for that so loaded data reaches the component.
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const get = jest.fn((filter: any) => {
    const key = JSON.stringify(filter);
    if (filter?.where?.parentType === 'proposal') {
      store.set(key, collection(COMMENTS));
    } else if (filter?.where?.parentType === 'post') {
      const ids: string[] = filter.where.parentId?.$in ?? [];
      store.set(
        key,
        collection(REPLIES.filter((reply) => ids.includes(reply.parentId))),
      );
    }
    queueMicrotask(notify);
    return Promise.resolve({});
  });

  return {
    get,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    platform: {
      post: {
        find: (filter: any) => store.get(JSON.stringify(filter)),
        areLoading: () => false,
        get,
        post: jest.fn(() => Promise.resolve({})),
      },
      user: {
        findOne: (id: string) => USERS.get(id),
        getOne: jest.fn(),
      },
    },
  };
};

describe('ProposalComments', () => {
  let harness: ReturnType<typeof buildPlatform>;

  beforeEach(() => {
    harness = buildPlatform();
    mockedUsePlatform.mockImplementation(() => {
      const [, force] = useState(0);
      useEffect(
        () => harness.subscribe(() => force((version) => version + 1)),
        [],
      );
      return { platform: harness.platform };
    });
    mockedUseAuth.mockReturnValue({
      user: { _id: 'u1', screenname: 'Alice' },
    });
  });

  it('renders every reply without the reader expanding anything', async () => {
    render(<ProposalComments proposal={PROPOSAL} />);

    expect(await screen.findByText('First comment')).toBeVisible();
    expect(await screen.findByText('Reply one')).toBeVisible();
    expect(await screen.findByText('Reply two')).toBeVisible();
    expect(await screen.findByText('Reply three')).toBeVisible();
  });

  it('fetches all replies in a single request keyed by every comment id', async () => {
    render(<ProposalComments proposal={PROPOSAL} />);

    await screen.findByText('Reply one');

    const replyCalls = harness.get.mock.calls.filter(
      ([filter]: any[]) => filter?.where?.parentType === 'post',
    );
    expect(replyCalls).toHaveLength(1);
    expect(replyCalls[0][0].where.parentId).toEqual({ $in: ['c1', 'c2'] });
  });

  it('collapses and restores a thread through the reply count toggle', async () => {
    render(<ProposalComments proposal={PROPOSAL} />);

    await screen.findByText('Reply one');

    // Threads start expanded, so each one offers a hide toggle.
    fireEvent.click(screen.getAllByText('governance_hide_replies')[0]);

    await waitFor(() =>
      expect(screen.queryByText('Reply one')).not.toBeInTheDocument(),
    );
    // The sibling thread is untouched.
    expect(screen.getByText('Reply three')).toBeVisible();

    fireEvent.click(
      screen.getByText('governance_show_replies_count:{"count":2}'),
    );
    expect(await screen.findByText('Reply one')).toBeVisible();
  });
});
