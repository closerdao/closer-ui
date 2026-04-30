import React from 'react';

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import HeroCloser from './HeroCloser';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock PromptGetInTouchContext
const mockSetIsOpen = jest.fn();
jest.mock('closer/components/PromptGetInTouchContext', () => ({
  PromptGetInTouchContext: React.createContext({ setIsOpen: mockSetIsOpen }),
}));

// Mock the Spinner from 'closer'
jest.mock('closer', () => ({
  Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }, 'Loading...'),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => React.createElement('svg', { 'data-testid': 'icon-close' }),
  MessageCircle: () =>
    React.createElement('svg', { 'data-testid': 'icon-message-circle' }),
  Send: () => React.createElement('svg', { 'data-testid': 'icon-send' }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Returns a fetch-like response object (not wrapped in a promise, since
// mockFetch.mockReturnValue is used so the promise wrapping happens there)
const defaultFetchResponse = (content: string = 'Test answer from agent') => ({
  json: () =>
    Promise.resolve({
      choices: [{ message: { content } }],
    }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HeroCloser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReturnValue(Promise.resolve(defaultFetchResponse()));
  });

  describe('initial render', () => {
    it('renders without crashing', () => {
      render(<HeroCloser />);
      // The component should mount without throwing
    });

    it('renders the main hero heading', () => {
      render(<HeroCloser />);
      expect(
        screen.getByRole('heading', { level: 1 }),
      ).toBeInTheDocument();
    });

    it('renders the hero section tagline', () => {
      render(<HeroCloser />);
      expect(
        screen.getByText(/The operating system for regenerative communities/i),
      ).toBeInTheDocument();
    });

    it('renders the Explore anchor link', () => {
      render(<HeroCloser />);
      const exploreLink = screen.getByRole('link', { name: /Explore/i });
      expect(exploreLink).toBeInTheDocument();
      expect(exploreLink).toHaveAttribute('href', '#features');
    });

    it('renders the floating chat open button initially', () => {
      render(<HeroCloser />);
      const openButton = screen.getByRole('button', { name: /Open chat/i });
      expect(openButton).toBeInTheDocument();
    });

    it('does NOT render the chat panel initially', () => {
      render(<HeroCloser />);
      // Chat panel header should not be visible
      expect(screen.queryByText(/Closer AI/i)).not.toBeInTheDocument();
    });
  });

  describe('chat panel open/close', () => {
    it('opens the chat panel when the open button is clicked', async () => {
      render(<HeroCloser />);
      const openButton = screen.getByRole('button', { name: /Open chat/i });

      await act(async () => {
        fireEvent.click(openButton);
      });

      expect(screen.getByText(/Closer AI/i)).toBeInTheDocument();
    });

    it('hides the floating open button when chat panel is open', async () => {
      render(<HeroCloser />);
      const openButton = screen.getByRole('button', { name: /Open chat/i });

      await act(async () => {
        fireEvent.click(openButton);
      });

      expect(
        screen.queryByRole('button', { name: /Open chat/i }),
      ).not.toBeInTheDocument();
    });

    it('shows the close (X) button inside the chat panel', async () => {
      render(<HeroCloser />);
      const openButton = screen.getByRole('button', { name: /Open chat/i });

      await act(async () => {
        fireEvent.click(openButton);
      });

      const closeButton = screen.getByRole('button', { name: /Close chat/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('closes the chat panel when the close button is clicked', async () => {
      render(<HeroCloser />);

      // Open
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });

      expect(screen.getByText(/Closer AI/i)).toBeInTheDocument();

      // Close
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Close chat/i }));
      });

      expect(screen.queryByText(/Closer AI/i)).not.toBeInTheDocument();
    });

    it('shows the floating open button again after closing the chat panel', async () => {
      render(<HeroCloser />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Close chat/i }));
      });

      expect(
        screen.getByRole('button', { name: /Open chat/i }),
      ).toBeInTheDocument();
    });
  });

  describe('chat input', () => {
    const openChat = async () => {
      render(<HeroCloser />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });
    };

    it('renders a text input for the message', async () => {
      await openChat();
      const input = screen.getByPlaceholderText(/Type a message.../i);
      expect(input).toBeInTheDocument();
      expect(input).toBeEnabled();
    });

    it('renders the send button', async () => {
      await openChat();
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('send button is disabled when input is empty', async () => {
      await openChat();
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('send button becomes enabled when user types a message', async () => {
      await openChat();
      const input = screen.getByPlaceholderText(/Type a message.../i);
      const sendButton = screen.getByRole('button', { name: /Send message/i });

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Hello' } });
      });

      expect(sendButton).not.toBeDisabled();
    });

    it('send button is disabled when input contains only whitespace', async () => {
      await openChat();
      const input = screen.getByPlaceholderText(/Type a message.../i);
      const sendButton = screen.getByRole('button', { name: /Send message/i });

      await act(async () => {
        fireEvent.change(input, { target: { value: '   ' } });
      });

      expect(sendButton).toBeDisabled();
    });

    it('shows empty state message when no conversation has started', async () => {
      await openChat();
      expect(screen.getByText(/Ask me anything about Closer/i)).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    const openChatAndType = async (message: string) => {
      render(<HeroCloser />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });
      const input = screen.getByPlaceholderText(/Type a message.../i);
      await act(async () => {
        fireEvent.change(input, { target: { value: message } });
      });
      return input;
    };

    it('clears the input field after form submission', async () => {
      const input = await openChatAndType('What is Closer?');

      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe('');
      });
    });

    it('displays the user question in the conversation after submission', async () => {
      const question = 'What is Closer?';
      const input = await openChatAndType(question);

      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });
    });

    it('calls fetch with the correct API endpoint', async () => {
      const input = await openChatAndType('Tell me about governance');

      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://tuoxw2y6xrmhamaiqclxy33c.agents.do-ai.run/api/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          }),
        );
      });
    });

    it('calls fetch with the user message in the request body', async () => {
      const question = 'How does token governance work?';
      const input = await openChatAndType(question);

      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [, options] = mockFetch.mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.messages[0].content).toBe(question);
        expect(body.messages[0].role).toBe('user');
      });
    });

    it('displays the agent answer in the conversation after successful fetch', async () => {
      const answer = 'Closer is a platform for regenerative communities';
      mockFetch.mockReturnValue(Promise.resolve(defaultFetchResponse(answer)));

      const input = await openChatAndType('What is Closer?');
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(screen.getByText(answer)).toBeInTheDocument();
      });
    });

    it('displays an error message when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const input = await openChatAndType('Will this fail?');
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/Sorry, I encountered an error. Please try again./i),
        ).toBeInTheDocument();
      });
    });

    it('uses fallback answer when API response has no choices', async () => {
      mockFetch.mockReturnValue(
        Promise.resolve({
          json: () => Promise.resolve({ choices: [] }),
        }),
      );

      const input = await openChatAndType('What happens with empty response?');
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/A new vision for your community\./i),
        ).toBeInTheDocument();
      });
    });

    it('does not submit when input is empty (form prevented)', async () => {
      render(<HeroCloser />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });
      const input = screen.getByPlaceholderText(/Type a message.../i);

      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('disables the input while loading', async () => {
      // Mock fetch to never resolve so we stay in loading state
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      let resolvePromise: (v: any) => void = () => {};
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const input = await openChatAndType('Test loading state');
      await act(async () => {
        fireEvent.submit(input.closest('form')!);
      });

      // Input should be disabled while loading
      expect(input).toBeDisabled();

      // Resolve to clean up pending async state
      await act(async () => {
        resolvePromise({ json: () => Promise.resolve({ choices: [] }) });
      });
    });
  });

  describe('multiple conversation turns', () => {
    it('accumulates multiple exchanges in the conversation', async () => {
      mockFetch
        .mockReturnValueOnce(Promise.resolve(defaultFetchResponse('First answer')))
        .mockReturnValueOnce(Promise.resolve(defaultFetchResponse('Second answer')));

      render(<HeroCloser />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Open chat/i }));
      });

      const input = screen.getByPlaceholderText(/Type a message.../i);

      // First message
      await act(async () => {
        fireEvent.change(input, { target: { value: 'First question' } });
        fireEvent.submit(input.closest('form')!);
      });
      await waitFor(() => {
        expect(screen.getByText('First answer')).toBeInTheDocument();
      });

      // Second message
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Second question' } });
        fireEvent.submit(input.closest('form')!);
      });
      await waitFor(() => {
        expect(screen.getByText('Second answer')).toBeInTheDocument();
      });

      // Both questions visible
      expect(screen.getByText('First question')).toBeInTheDocument();
      expect(screen.getByText('Second question')).toBeInTheDocument();
    });
  });
});