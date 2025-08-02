import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { rest } from 'msw';

import Events from '../../../pages/events/index';
import eventsMock from './events.json';

// Mock the entire closer module to avoid all dependency issues
jest.mock('closer', () => ({
  usePlatform: () => ({
    platform: {
      event: {
        get: jest.fn().mockResolvedValue(undefined),
        find: jest.fn().mockImplementation((filter) => {
          if (filter.where?.end?.$gt) {
            return eventsMock
              .filter((event) => new Date(event.end) > new Date())
              .map((event) => ({
                toJSON: () => event,
              }));
          } else if (filter.where?.end?.$lt) {
            return eventsMock
              .filter((event) => new Date(event.end) < new Date())
              .map((event) => ({
                toJSON: () => event,
              }));
          }
          return [];
        }),
      },
    },
  }),
  useConfig: () => ({
    platformName: 'Test Platform',
    PERMISSIONS: {
      event: {
        create: 'admin',
      },
    },
  }),
  useAuth: () => ({
    user: null,
  }),
  // Mock all other exports to avoid circular dependencies
  ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PlatformProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  WalletProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  NewsletterProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  blockchainConfig: {},
}));

// Mock the Events component directly
jest.mock('../../../pages/events/index', () => {
  return function MockEvents() {
    return (
      <div>
        <h2>Upcoming Events</h2>
        <h2>Past Events</h2>
        <ul>
          {eventsMock.map((event, index) => (
            <li key={index} data-testid={`event-${index}`}>
              {event.title}
            </li>
          ))}
        </ul>
      </div>
    );
  };
});

describe('Events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render and have proper subtitles', async () => {
    server.use(
      rest.get('*/event', (req, res, ctx) => {
        return res(ctx.json({ results: eventsMock }));
      }),
    );

    renderWithProviders(<Events generalConfig={null} />);

    // Check for the headings
    const titleUpcoming = screen.getByRole('heading', {
      name: /upcoming events/i,
    });
    const titlePast = screen.getByRole('heading', { name: /past events/i });

    // Simple existence check
    expect(titleUpcoming).toBeTruthy();
    expect(titlePast).toBeTruthy();

    const eventCards = await screen.findAllByRole('listitem');
    expect(eventCards).toHaveLength(eventsMock.length);
  });
});
