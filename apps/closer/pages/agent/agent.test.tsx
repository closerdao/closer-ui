import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import AgentPage from './index';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetIsOpen = jest.fn();

// Mock PromptGetInTouchContext - AgentPage destructures setIsOpen from it
jest.mock('closer/components/PromptGetInTouchContext', () => {
  const context = React.createContext<{ setIsOpen: (open: boolean) => void }>({
    setIsOpen: mockSetIsOpen,
  });
  return {
    PromptGetInTouchContext: context,
    PromptGetInTouchProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(context.Provider, { value: { setIsOpen: mockSetIsOpen } }, children),
  };
});

// Mock 'closer' API and utilities
jest.mock('closer', () => ({
  api: {
    get: jest.fn(() => Promise.resolve({ data: { results: { value: {} } } })),
  },
  parseMessageFromError: jest.fn((err: unknown) => String(err)),
}));

// Mock locale helper
jest.mock('closer/utils/locale.helpers', () => ({
  loadLocaleData: jest.fn(() => Promise.resolve({})),
}));

// Mock next/head
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const renderAgentPage = (props = {}) => {
  return render(
    <AgentPage generalConfig={null} {...props} />,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AgentPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('page structure', () => {
    it('renders without crashing', () => {
      expect(() => renderAgentPage()).not.toThrow();
    });

    it('renders the main hero heading', () => {
      renderAgentPage();
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Turn community knowledge into/i);
    });

    it('renders the italicized "living intelligence" text in the heading', () => {
      renderAgentPage();
      expect(screen.getByText(/living intelligence/i)).toBeInTheDocument();
    });

    it('renders the hero description text', () => {
      renderAgentPage();
      expect(
        screen.getByText(
          /transforms your conversations, documents, and institutional memory/i,
        ),
      ).toBeInTheDocument();
    });

    it('renders the "Deploy for your community" CTA button', () => {
      renderAgentPage();
      const ctaButton = screen.getByRole('button', {
        name: /Deploy for your community/i,
      });
      expect(ctaButton).toBeInTheDocument();
    });

    it('renders the "See capabilities" anchor link', () => {
      renderAgentPage();
      const link = screen.getByRole('link', { name: /See capabilities/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '#capabilities');
    });
  });

  describe('Principles section', () => {
    it('renders the Principles section heading', () => {
      renderAgentPage();
      expect(
        screen.getByText(/Intelligence that serves the commons/i),
      ).toBeInTheDocument();
    });

    it('renders all three principles', () => {
      renderAgentPage();
      expect(screen.getByText(/Data stays home/i)).toBeInTheDocument();
      expect(screen.getByText(/Community-governed/i)).toBeInTheDocument();
      expect(screen.getByText(/Federated by design/i)).toBeInTheDocument();
    });

    it('renders the principle descriptions', () => {
      renderAgentPage();
      expect(
        screen.getByText(/Your community's knowledge never leaves your infrastructure/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Token holders decide what data enters the knowledge base/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Connect with other Closer communities to share learnings/i),
      ).toBeInTheDocument();
    });
  });

  describe('Domain Expertise section', () => {
    it('renders the Domain Expertise section', () => {
      renderAgentPage();
      expect(screen.getByText(/Built for regenerative work/i)).toBeInTheDocument();
    });

    it('renders the four domain cards', () => {
      renderAgentPage();
      expect(screen.getByText(/Water Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Biodiversity/i)).toBeInTheDocument();
      expect(screen.getByText(/Governance/i)).toBeInTheDocument();
      expect(screen.getByText(/Financial/i)).toBeInTheDocument();
    });
  });

  describe('Core Features section', () => {
    it('renders the Core Features section heading', () => {
      renderAgentPage();
      expect(screen.getByText(/Everything your community needs/i)).toBeInTheDocument();
    });

    it('renders all six core feature cards', () => {
      renderAgentPage();
      expect(screen.getByText(/Conversational Intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/Multi-Format Ingestion/i)).toBeInTheDocument();
      expect(screen.getByText(/AI-Enhanced Tasks/i)).toBeInTheDocument();
      expect(screen.getByText(/Relationship Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Isolation/i)).toBeInTheDocument();
      expect(screen.getByText(/Environmental Context/i)).toBeInTheDocument();
    });
  });

  describe('Capabilities section', () => {
    it('renders the Capabilities section heading', () => {
      renderAgentPage();
      expect(screen.getByText(/Capabilities in detail/i)).toBeInTheDocument();
    });

    it('renders the Conversational AI capability', () => {
      renderAgentPage();
      expect(screen.getByText(/Conversational AI/i)).toBeInTheDocument();
    });

    it('renders the AI-Enhanced Task Management capability', () => {
      renderAgentPage();
      expect(screen.getByText(/AI-Enhanced Task Management/i)).toBeInTheDocument();
    });

    it('renders the Multi-Format Data Ingestion capability', () => {
      renderAgentPage();
      expect(screen.getByText(/Multi-Format Data Ingestion/i)).toBeInTheDocument();
    });
  });

  describe('Sovereignty section', () => {
    it('renders the sovereignty section heading', () => {
      renderAgentPage();
      expect(
        screen.getByText(/Your data. Your hardware. Your/i),
      ).toBeInTheDocument();
    });

    it('renders the sovereignty description', () => {
      renderAgentPage();
      expect(
        screen.getByText(
          /Traditional AI services create dependency/i,
        ),
      ).toBeInTheDocument();
    });

    it('renders the four sovereignty pillars', () => {
      renderAgentPage();
      expect(screen.getByText(/Hardware you control/i)).toBeInTheDocument();
      expect(screen.getByText(/Weights you own/i)).toBeInTheDocument();
      expect(screen.getByText(/Training you direct/i)).toBeInTheDocument();
      expect(screen.getByText(/Governance you define/i)).toBeInTheDocument();
    });
  });

  describe('Roadmap section', () => {
    it('renders the Roadmap section heading', () => {
      renderAgentPage();
      expect(screen.getByText(/What's coming/i)).toBeInTheDocument();
    });

    it('renders Q1 2026 roadmap period', () => {
      renderAgentPage();
      expect(screen.getByText(/Q1 2026/i)).toBeInTheDocument();
    });

    it('renders Q2 2026 roadmap period', () => {
      renderAgentPage();
      expect(screen.getByText(/Q2 2026/i)).toBeInTheDocument();
    });

    it('renders Workflow Automation roadmap item', () => {
      renderAgentPage();
      expect(screen.getByText(/Workflow Automation/i)).toBeInTheDocument();
    });

    it('renders Advanced Analytics roadmap item', () => {
      renderAgentPage();
      expect(screen.getByText(/Advanced Analytics/i)).toBeInTheDocument();
    });

    it('renders Multi-Agent & Federation roadmap item', () => {
      renderAgentPage();
      expect(screen.getByText(/Multi-Agent & Federation/i)).toBeInTheDocument();
    });
  });

  describe('Call-to-action section', () => {
    it('renders the final CTA heading', () => {
      renderAgentPage();
      expect(
        screen.getByRole('heading', { name: /Ready to grow your commons\?/i }),
      ).toBeInTheDocument();
    });

    it('renders the alpha availability notice', () => {
      renderAgentPage();
      expect(
        screen.getByText(/Currently in alpha — not yet commercially available/i),
      ).toBeInTheDocument();
    });

    it('renders the "Get in touch" button', () => {
      renderAgentPage();
      const getInTouchButtons = screen.getAllByRole('button', {
        name: /Get in touch/i,
      });
      expect(getInTouchButtons.length).toBeGreaterThan(0);
    });
  });

  describe('setIsOpen interaction', () => {
    it('calls setIsOpen(true) when "Deploy for your community" button is clicked', async () => {
      renderAgentPage();
      const ctaButton = screen.getByRole('button', {
        name: /Deploy for your community/i,
      });

      await act(async () => {
        fireEvent.click(ctaButton);
      });

      expect(mockSetIsOpen).toHaveBeenCalledWith(true);
    });

    it('calls setIsOpen(true) when "Get in touch" button is clicked', async () => {
      renderAgentPage();
      const getInTouchButtons = screen.getAllByRole('button', {
        name: /Get in touch/i,
      });
      const lastButton = getInTouchButtons[getInTouchButtons.length - 1];

      await act(async () => {
        fireEvent.click(lastButton);
      });

      expect(mockSetIsOpen).toHaveBeenCalledWith(true);
    });
  });
});