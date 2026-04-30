import React from 'react';

import { render, screen } from '@testing-library/react';

import { Footer } from './Footer';

// Mock the 'closer' package's useConfig hook
const mockUseConfig = jest.fn();
jest.mock('closer', () => ({
  useConfig: () => mockUseConfig(),
}));

// Mock next/link to render a plain anchor
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) =>
    React.createElement(
      'a',
      { href, className },
      children,
    ),
}));

// Mock react-icons used in Footer
jest.mock('@react-icons/all-files/fa/FaTelegram', () => ({
  FaTelegram: () => React.createElement('svg', { 'data-testid': 'icon-telegram' }),
}));
jest.mock('@react-icons/all-files/si/SiInstagram', () => ({
  SiInstagram: () => React.createElement('svg', { 'data-testid': 'icon-instagram' }),
}));
jest.mock('@react-icons/all-files/ri/RiFacebookFill', () => ({
  RiFacebookFill: () =>
    React.createElement('svg', { 'data-testid': 'icon-facebook' }),
}));

describe('Footer', () => {
  beforeEach(() => {
    // Default: no social URLs or email configured
    mockUseConfig.mockReturnValue({
      INSTAGRAM_URL: undefined,
      FACEBOOK_URL: undefined,
      TEAM_EMAIL: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('static content', () => {
    it('renders the footer element', () => {
      render(<Footer />);
      const footer = document.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('renders the tagline text', () => {
      render(<Footer />);
      expect(
        screen.getByText(/Building the governance infrastructure for shared abundance/i),
      ).toBeInTheDocument();
    });

    it('renders the description text', () => {
      render(<Footer />);
      expect(
        screen.getByText(/Pioneering regenerative villages that unite technology, community & nature/i),
      ).toBeInTheDocument();
    });

    it('renders the copyright notice with current year', () => {
      render(<Footer />);
      const currentYear = new Date().getFullYear().toString();
      expect(
        screen.getByText(new RegExp(`${currentYear}.*Closer`)),
      ).toBeInTheDocument();
    });

    it('renders the Privacy Policy link pointing to /privacy-policy', () => {
      render(<Footer />);
      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });

    it('renders the Documentation external link', () => {
      render(<Footer />);
      const docsLink = screen.getByRole('link', { name: /Documentation/i });
      expect(docsLink).toBeInTheDocument();
      expect(docsLink).toHaveAttribute(
        'href',
        'https://closer.gitbook.io/documentation',
      );
      expect(docsLink).toHaveAttribute('target', '_blank');
      expect(docsLink).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('navigation links', () => {
    it('renders the Philosophy navigation link', () => {
      render(<Footer />);
      const philosophyLink = screen.getByRole('link', { name: /^Philosophy$/i });
      expect(philosophyLink).toBeInTheDocument();
      expect(philosophyLink).toHaveAttribute('href', '/philosophy');
    });

    it('renders the Commons Governance navigation link', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /Commons Governance/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/philosophy/commons-governance');
    });

    it('renders the Commons Exclosure navigation link', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /Commons Exclosure/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/philosophy/commons-exclosure');
    });

    it('renders the Digital Commons navigation link', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /Digital Commons/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/philosophy/digital-commons');
    });

    it('renders the Shared Abundance navigation link', () => {
      render(<Footer />);
      const link = screen.getByRole('link', { name: /Shared Abundance/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/philosophy/shared-abundance');
    });
  });

  describe('Telegram social link', () => {
    it('always renders the Telegram link regardless of config', () => {
      render(<Footer />);
      // Telegram link has an icon child and no text label, find by href
      const telegramAnchor = document.querySelector(
        'a[href="https://t.me/+rdZvSdohTzs0Njlh"]',
      );
      expect(telegramAnchor).toBeInTheDocument();
      expect(telegramAnchor).toHaveAttribute('target', '_blank');
      expect(telegramAnchor).toHaveAttribute('rel', 'noreferrer');
    });

    it('renders the Telegram icon', () => {
      render(<Footer />);
      expect(screen.getByTestId('icon-telegram')).toBeInTheDocument();
    });
  });

  describe('Instagram social link (conditional)', () => {
    it('does NOT render Instagram link when INSTAGRAM_URL is undefined', () => {
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      expect(screen.queryByTestId('icon-instagram')).not.toBeInTheDocument();
    });

    it('renders Instagram link when INSTAGRAM_URL is provided', () => {
      const instagramUrl = 'https://instagram.com/testcommunity';
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: instagramUrl,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      const instagramIcon = screen.getByTestId('icon-instagram');
      expect(instagramIcon).toBeInTheDocument();
      const instagramLink = instagramIcon.closest('a');
      expect(instagramLink).toHaveAttribute('href', instagramUrl);
      expect(instagramLink).toHaveAttribute('target', '_blank');
      expect(instagramLink).toHaveAttribute('rel', 'noreferrer');
    });
  });

  describe('Facebook social link (conditional)', () => {
    it('does NOT render Facebook link when FACEBOOK_URL is undefined', () => {
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      expect(screen.queryByTestId('icon-facebook')).not.toBeInTheDocument();
    });

    it('renders Facebook link when FACEBOOK_URL is provided', () => {
      const facebookUrl = 'https://facebook.com/testcommunity';
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: facebookUrl,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      const facebookIcon = screen.getByTestId('icon-facebook');
      expect(facebookIcon).toBeInTheDocument();
      const facebookLink = facebookIcon.closest('a');
      expect(facebookLink).toHaveAttribute('href', facebookUrl);
      expect(facebookLink).toHaveAttribute('target', '_blank');
      expect(facebookLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
      expect(facebookLink).toHaveAttribute('rel', expect.stringContaining('nofollow'));
    });
  });

  describe('TEAM_EMAIL contact section (conditional)', () => {
    it('does NOT render the contact email section when TEAM_EMAIL is undefined', () => {
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      expect(screen.queryByText(/Questions\? Reach out at/i)).not.toBeInTheDocument();
    });

    it('renders the contact email when TEAM_EMAIL is provided', () => {
      const teamEmail = 'hello@testcommunity.com';
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: teamEmail,
      });
      render(<Footer />);
      expect(screen.getByText(/Questions\? Reach out at/i)).toBeInTheDocument();
      const emailLink = screen.getByRole('link', { name: teamEmail });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', `mailto:${teamEmail}`);
    });

    it('renders the correct mailto href for the team email', () => {
      const teamEmail = 'support@community.earth';
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: teamEmail,
      });
      render(<Footer />);
      const emailLink = screen.getByRole('link', { name: teamEmail });
      expect(emailLink).toHaveAttribute('href', `mailto:${teamEmail}`);
    });
  });

  describe('all social media links present', () => {
    it('renders all three social icons when all URLs and email are set', () => {
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: 'https://instagram.com/test',
        FACEBOOK_URL: 'https://facebook.com/test',
        TEAM_EMAIL: 'test@test.com',
      });
      render(<Footer />);
      expect(screen.getByTestId('icon-telegram')).toBeInTheDocument();
      expect(screen.getByTestId('icon-instagram')).toBeInTheDocument();
      expect(screen.getByTestId('icon-facebook')).toBeInTheDocument();
    });

    it('renders only Telegram when no other social URLs configured', () => {
      mockUseConfig.mockReturnValue({
        INSTAGRAM_URL: undefined,
        FACEBOOK_URL: undefined,
        TEAM_EMAIL: undefined,
      });
      render(<Footer />);
      expect(screen.getByTestId('icon-telegram')).toBeInTheDocument();
      expect(screen.queryByTestId('icon-instagram')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-facebook')).not.toBeInTheDocument();
    });
  });

  describe('useConfig returns null', () => {
    it('renders without crashing when useConfig returns null', () => {
      mockUseConfig.mockReturnValue(null);
      expect(() => render(<Footer />)).not.toThrow();
    });

    it('does not render email section when useConfig returns null', () => {
      mockUseConfig.mockReturnValue(null);
      render(<Footer />);
      expect(screen.queryByText(/Questions\? Reach out at/i)).not.toBeInTheDocument();
    });

    it('does not render instagram when useConfig returns null', () => {
      mockUseConfig.mockReturnValue(null);
      render(<Footer />);
      expect(screen.queryByTestId('icon-instagram')).not.toBeInTheDocument();
    });
  });
});